import json
import logging
import urllib.request
import urllib.error
from django.conf import settings

logger = logging.getLogger(__name__)


def normalize_phone_number(phone: str) -> str:
  """Normalizes phone numbers to standard E.164 without leading plus sign."""
  cleaned = ''.join(c for c in str(phone) if c.isdigit())
  if len(cleaned) == 10:
    # Default to India 91 if 10 digits
    return f'91{cleaned}'
  return cleaned


class WhatsAppClient:

  @classmethod
  def send_payload(cls, payload: dict) -> dict:
    """Sends a raw JSON payload to the Meta Facebook Graph API for WhatsApp messages."""
    phone_number_id = getattr(
        settings, 'WHATSAPP_PHONE_NUMBER_ID', '100000000000000'
    )
    access_token = getattr(settings, 'WHATSAPP_ACCESS_TOKEN', '')
    version = getattr(settings, 'WHATSAPP_GRAPH_VERSION', 'v21.0')

    url = f'https://graph.facebook.com/{version}/{phone_number_id}/messages'

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url, data=data, headers=headers, method='POST'
    )

    try:
      with urllib.request.urlopen(req, timeout=10) as response:
        res_body = response.read().decode('utf-8')
        res_data = json.loads(res_body)
        messages = res_data.get('messages', [])
        message_id = messages[0].get('id') if messages else None
        return {
            'success': True,
            'status_code': response.status,
            'message_id': message_id,
            'raw_response': res_data,
        }
    except urllib.error.HTTPError as e:
      err_body = e.read().decode('utf-8')
      logger.error(
          f'Meta WhatsApp Graph API HTTP Error {e.code}: {err_body}'
      )
      try:
        err_json = json.loads(err_body)
      except Exception:
        err_json = {'error': err_body}
      return {
          'success': False,
          'status_code': e.code,
          'error': err_json,
          'message_id': None,
      }
    except Exception as e:
      logger.error(f'WhatsApp Client unexpected error: {str(e)}')
      return {
          'success': False,
          'status_code': 500,
          'error': str(e),
          'message_id': None,
      }


class WhatsAppSender:

  @classmethod
  def build_template_payload(
      cls,
      recipient_phone: str,
      template_name: str,
      language_code: str = 'en',
      components: list = None,
  ) -> dict:
    """Constructs a Meta Graph API v21.0 payload for sending pre-approved WhatsApp templates."""
    phone = normalize_phone_number(recipient_phone)
    payload = {
        'messaging_product': 'whatsapp',
        'recipient_type': 'individual',
        'to': phone,
        'type': 'template',
        'template': {
            'name': template_name,
            'language': {'code': language_code},
        },
    }

    if components:
      payload['template']['components'] = components

    return payload

  @classmethod
  def build_text_payload(
      cls, recipient_phone: str, text_message: str
  ) -> dict:
    """Constructs a Meta Graph API v21.0 payload for free-form text messages."""
    phone = normalize_phone_number(recipient_phone)
    return {
        'messaging_product': 'whatsapp',
        'recipient_type': 'individual',
        'to': phone,
        'type': 'text',
        'text': {'preview_url': False, 'body': text_message},
    }


class WhatsAppManager:

  @classmethod
  def send_template(
      cls,
      recipient_phone: str,
      template_name: str,
      language_code: str = 'en',
      parameters: list = None,
  ) -> dict:
    """Central helper to format and dispatch template messages to Meta Graph API."""
    components = []
    if parameters:
      # Build text parameter components for the template body
      param_objs = [{'type': 'text', 'text': str(p)} for p in parameters]
      components.append({'type': 'body', 'parameters': param_objs})

    payload = WhatsAppSender.build_template_payload(
        recipient_phone=recipient_phone,
        template_name=template_name,
        language_code=language_code,
        components=components,
    )

    result = WhatsAppClient.send_payload(payload)

    # Automatic fallback retry logic for Meta error 132001 (Template translation mismatch)
    if not result.get('success'):
      err = result.get('error', {})
      err_code = (
          err.get('error', {}).get('code') if isinstance(err, dict) else None
      )
      if err_code == 132001:
        logger.info(
            f'Meta 132001 language mismatch for {template_name} ({language_code}). Retrying fallbacks...'
        )
        fallback_codes = ['en', 'en_IN', 'hi', 'en_US']
        for alt_lang in fallback_codes:
          if alt_lang != language_code:
            payload_alt = WhatsAppSender.build_template_payload(
                recipient_phone=recipient_phone,
                template_name=template_name,
                language_code=alt_lang,
                components=components,
            )
            alt_res = WhatsAppClient.send_payload(payload_alt)
            if alt_res.get('success'):
              logger.info(
                  f'Meta WhatsApp template {template_name} sent successfully using fallback language code: {alt_lang}'
              )
              return alt_res

    return result

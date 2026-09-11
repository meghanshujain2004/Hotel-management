from datetime import timedelta
from django.utils import timezone
from django.db.models import Case, When, Value, IntegerField
from .models import Lead, ActivityLog, WhatsAppTemplate


class WhatsAppService:
    @staticmethod
    def render_template(template_body: str, context: dict) -> str:
        safe_context = {
            'guest_name': context.get('guest_name', 'Valued Guest'),
            'phone': context.get('phone', ''),
            'followup_date_time': context.get('followup_date_time', 'our scheduled time'),
            'gallery_url': context.get('gallery_url', 'https://hotelcrm.example.com/gallery'),
            'booking_code': context.get('booking_code', 'HOTELVIP15'),
            'staff_name': context.get('staff_name', 'Our Reservation Team'),
            'manager_name': context.get('manager_name', 'Sales Supervisor'),
            'hotel_name': context.get('hotel_name', 'Grand Luxury Resort & Spa'),
        }
        rendered = template_body
        for key, val in safe_context.items():
            rendered = rendered.replace(f"{{{key}}}", str(val))
        return rendered

    @classmethod
    def dispatch_for_trigger(cls, trigger: str, lead: Lead, user=None, extra_context=None) -> ActivityLog | None:
        try:
            template = WhatsAppTemplate.objects.filter(outcome_trigger=trigger, is_active=True).first()
            if not template:
                return None

            context = {
                'guest_name': lead.guest_name,
                'phone': lead.phone,
                'followup_date_time': lead.followup_date_time.strftime('%b %d, %Y at %I:%M %p') if lead.followup_date_time else '',
                'staff_name': lead.assigned_to.get_full_name() or lead.assigned_to.username if lead.assigned_to else 'Support Staff',
                'manager_name': lead.assigned_manager.get_full_name() or lead.assigned_manager.username if lead.assigned_manager else 'Manager',
            }
            if extra_context:
                context.update(extra_context)

            message_body = cls.render_template(template.template_body, context)

            # In production, integrate WhatsApp Cloud API / Twilio here.
            # We record the activity log with the rendered message and dispatch status.
            log = ActivityLog.objects.create(
                lead=lead,
                user=user,
                activity_type='whatsapp_dispatched',
                notes=f"Automated WhatsApp ({template.name}) sent to {lead.phone}",
                whatsapp_template_name=template.name,
                whatsapp_message_body=message_body,
                whatsapp_status='sent',
            )
            return log
        except Exception as e:
            # Failure fallback
            return None


class QueueService:
    @staticmethod
    def get_queue_queryset(user):
        """
        Retrieves ordered active leads for a Customer Support user.
        Excludes finalized leads (registered, not_interested, lost).
        Prioritizes:
        1. Urgent priority and escalations
        2. Date created (FIFO)
        """
        closed_statuses = ['registered', 'not_interested', 'lost']
        
        # Priority weight
        priority_weight = Case(
            When(priority='urgent', then=Value(4)),
            When(priority='high', then=Value(3)),
            When(priority='medium', then=Value(2)),
            When(priority='low', then=Value(1)),
            default=Value(2),
            output_field=IntegerField()
        )

        # Escalation weight
        escalation_weight = Case(
            When(escalation_level='level2_admin', then=Value(4)),
            When(escalation_level='level1_manager', then=Value(3)),
            When(escalation_level='day3_reminder', then=Value(2)),
            When(escalation_level='day1_reminder', then=Value(1)),
            default=Value(0),
            output_field=IntegerField()
        )

        # Uncontacted weight: Uncalled leads come before already contacted leads
        uncontacted_weight = Case(
            When(last_contacted_at__isnull=True, then=Value(1)),
            default=Value(0),
            output_field=IntegerField()
        )

        qs = Lead.objects.filter(
            assigned_to=user
        ).exclude(
            status__in=closed_statuses
        ).annotate(
            p_weight=priority_weight,
            e_weight=escalation_weight,
            is_uncalled=uncontacted_weight
        ).order_by('-e_weight', '-is_uncalled', '-p_weight', 'created_at')

        return qs

    @classmethod
    def get_active_lead_for_user(cls, user):
        """
        Returns the top active lead in the queue along with queue position stats.
        """
        qs = cls.get_queue_queryset(user)
        total_in_queue = qs.count()
        current_lead = qs.first()
        return current_lead, total_in_queue


class DispositionService:
    @classmethod
    def handle_disposition(cls, lead: Lead, user, disposition_status: str, call_duration: int = 0, notes: str = "", followup_date_time=None):
        """
        Saves post-call disposition, updates lead state, logs activities, dispatches WhatsApp template,
        and retrieves next active lead in queue.
        """
        old_status = lead.status
        lead.status = disposition_status
        lead.last_contacted_at = timezone.now()
        lead.last_call_duration = call_duration
        lead.last_disposition_note = notes
        
        if followup_date_time:
            lead.followup_date_time = followup_date_time

        # Reset escalation since action was taken
        if lead.is_escalated and disposition_status in ['interested', 'awaiting_followup', 'completed_followup', 'registered']:
            lead.is_escalated = False
            lead.escalation_level = 'normal'

        lead.save()

        # 1. Log Phone Call Activity
        ActivityLog.objects.create(
            lead=lead,
            user=user,
            activity_type='call',
            disposition=disposition_status,
            call_duration_seconds=call_duration,
            notes=notes or f"Call completed. Outcome: {lead.get_status_display()}"
        )

        # 2. Trigger Automated WhatsApp Template based on outcome
        whatsapp_log = None
        if disposition_status in ['interested', 'awaiting_followup', 'registered', 'not_interested']:
            whatsapp_log = WhatsAppService.dispatch_for_trigger(
                trigger=disposition_status,
                lead=lead,
                user=user
            )

        # 3. Retrieve next active lead for user
        next_lead, remaining_count = QueueService.get_active_lead_for_user(user)

        return {
            'updated_lead': lead,
            'whatsapp_dispatched': whatsapp_log is not None,
            'whatsapp_log': whatsapp_log,
            'next_lead': next_lead,
            'remaining_in_queue': remaining_count,
        }


class EscalationService:
    @classmethod
    def evaluate_all_leads(cls):
        """
        Evaluates SLA inactivity rules:
        - Day 1 (24h Inactive): Support reminder
        - Day 2 (48h Inactive): Level 1 Escalation to Manager (+1 Support Breach)
        - Day 3 (72h Inactive): Manager reminder
        - Day 4 (96h Inactive): Level 2 Critical Escalation to Admin (+1 Manager Breach)
        """
        now = timezone.now()
        closed_statuses = ['registered', 'not_interested', 'lost']
        active_leads = Lead.objects.exclude(status__in=closed_statuses)

        escalated_count = 0
        reminded_count = 0

        for lead in active_leads:
            reference_time = lead.last_contacted_at or lead.created_at
            elapsed_hours = (now - reference_time).total_seconds() / 3600

            if elapsed_hours >= 96 and lead.escalation_level != 'level2_admin':
                lead.escalation_level = 'level2_admin'
                lead.is_escalated = True
                lead.escalation_date = now
                lead.manager_breach_count += 1
                lead.save(update_fields=['escalation_level', 'is_escalated', 'escalation_date', 'manager_breach_count'])

                ActivityLog.objects.create(
                    lead=lead,
                    activity_type='escalated',
                    notes=f"CRITICAL ESCALATION (Level 2): Lead has been inactive for {int(elapsed_hours)} hours. Escalated to Admin. (+1 Manager Breach)"
                )
                WhatsAppService.dispatch_for_trigger('escalation_day4', lead)
                escalated_count += 1

            elif elapsed_hours >= 72 and elapsed_hours < 96 and lead.escalation_level not in ['day3_reminder', 'level2_admin']:
                lead.escalation_level = 'day3_reminder'
                lead.save(update_fields=['escalation_level'])

                ActivityLog.objects.create(
                    lead=lead,
                    activity_type='escalated',
                    notes=f"Manager SLA Reminder (Day 3): Lead has been pending for {int(elapsed_hours)} hours."
                )
                WhatsAppService.dispatch_for_trigger('escalation_day3', lead)
                reminded_count += 1

            elif elapsed_hours >= 48 and elapsed_hours < 72 and lead.escalation_level not in ['level1_manager', 'day3_reminder', 'level2_admin']:
                lead.escalation_level = 'level1_manager'
                lead.is_escalated = True
                lead.escalation_date = now
                lead.support_breach_count += 1
                lead.save(update_fields=['escalation_level', 'is_escalated', 'escalation_date', 'support_breach_count'])

                ActivityLog.objects.create(
                    lead=lead,
                    activity_type='escalated',
                    notes=f"ESCALATION ALERT (Level 1): Support agent failed to call for {int(elapsed_hours)} hours. Escalated to Manager queue. (+1 Support Breach)"
                )
                WhatsAppService.dispatch_for_trigger('escalation_day2', lead)
                escalated_count += 1

            elif elapsed_hours >= 24 and elapsed_hours < 48 and lead.escalation_level == 'normal':
                lead.escalation_level = 'day1_reminder'
                lead.save(update_fields=['escalation_level'])

                ActivityLog.objects.create(
                    lead=lead,
                    activity_type='escalated',
                    notes=f"Support SLA Reminder (Day 1): No call logged in {int(elapsed_hours)} hours."
                )
                WhatsAppService.dispatch_for_trigger('escalation_day1', lead)
                reminded_count += 1

        return {
            'evaluated_total': active_leads.count(),
            'escalated_count': escalated_count,
            'reminded_count': reminded_count,
        }


class ReassignmentService:
    @classmethod
    def reassign_lead(cls, lead: Lead, new_user, acting_user, notes: str = ""):
        """
        Handles Admin & Manager reassignment rules.
        - Admin can reassign Level 2 leads to any Manager.
        - Manager can reassign Level 1 leads to any Support agent.
        """
        old_assigned = lead.assigned_to
        old_manager = lead.assigned_manager

        if new_user.role == 'manager':
            lead.assigned_manager = new_user
            # Reset SLA escalation timer for new manager
            lead.escalation_level = 'normal'
            lead.is_escalated = False
            lead.escalation_date = None
            note_text = f"Lead reassigned by Admin ({acting_user.username}) to Manager {new_user.username}."
        else:
            lead.assigned_to = new_user
            # Reset SLA escalation timer for new support agent
            lead.escalation_level = 'normal'
            lead.is_escalated = False
            lead.escalation_date = None
            note_text = f"Lead reassigned by Manager ({acting_user.username}) from {old_assigned.username if old_assigned else 'Unassigned'} to Support Agent {new_user.username}."

        if notes:
            note_text += f" Reason: {notes}"

        lead.reassigned_notice = f"Lead was reassigned by {acting_user.get_role_display() if hasattr(acting_user, 'get_role_display') else acting_user.role} {acting_user.username}."
        lead.save()

        # Log Activity
        ActivityLog.objects.create(
            lead=lead,
            user=acting_user,
            activity_type='reassigned',
            notes=note_text
        )

        # Alert the newly assigned user
        WhatsAppService.dispatch_for_trigger(
            'reassignment_alert',
            lead,
            user=acting_user,
            extra_context={
                'staff_name': new_user.username,
                'manager_name': acting_user.username,
            }
        )

        return lead

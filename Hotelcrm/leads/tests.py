from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Lead, ActivityLog, WhatsAppTemplate
from .services import EscalationService, DispositionService, QueueService

User = get_user_model()


class LeadsAppTests(APITestCase):
    def setUp(self):
        # Create users
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='password123',
            role='admin',
            phone='+919999990001'
        )
        self.manager = User.objects.create_user(
            username='manager_test',
            email='manager@test.com',
            password='password123',
            role='manager',
            phone='+919999990002'
        )
        self.support1 = User.objects.create_user(
            username='support1_test',
            email='support1@test.com',
            password='password123',
            role='support',
            phone='+919999990003'
        )
        self.support2 = User.objects.create_user(
            username='support2_test',
            email='support2@test.com',
            password='password123',
            role='support',
            phone='+919999990004'
        )

        # Create WhatsApp template
        self.template_interested = WhatsAppTemplate.objects.create(
            name='Test Interested Template',
            outcome_trigger='interested',
            template_body='Hello {guest_name}, thank you for speaking with {staff_name}. Use code {booking_code}.',
            is_active=True
        )
        self.template_esc2 = WhatsAppTemplate.objects.create(
            name='Test Day 2 Escalation',
            outcome_trigger='escalation_day2',
            template_body='Alert: Lead {guest_name} escalated.',
            is_active=True
        )

        # Create Leads
        self.lead1 = Lead.objects.create(
            guest_name='Guest One',
            phone='+919000000001',
            source='website',
            inquiry_details='Deluxe Room 2 Nights',
            status='new',
            priority='high',
            assigned_to=self.support1,
            assigned_manager=self.manager
        )
        self.lead2 = Lead.objects.create(
            guest_name='Guest Two',
            phone='+919000000002',
            source='instagram',
            inquiry_details='Villa 3 Nights',
            status='new',
            priority='urgent',
            assigned_to=self.support1,
            assigned_manager=self.manager
        )

    def test_lead_directory_and_filter(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/leads/?source=website')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain lead1
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['guest_name'], 'Guest One')

    def test_sequential_queue_prioritization(self):
        # support1 has lead1 (high) and lead2 (urgent).
        # Queue should prioritize lead2 (urgent) first.
        self.client.force_authenticate(user=self.support1)
        response = self.client.get('/api/leads/queue/active/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['active_lead']['id'], self.lead2.id)
        self.assertEqual(response.data['total_in_queue'], 2)

    def test_disposition_submission_and_whatsapp_dispatch(self):
        self.client.force_authenticate(user=self.support1)
        data = {
            'lead_id': self.lead2.id,
            'disposition': 'interested',
            'call_duration_seconds': 145,
            'notes': 'Guest confirmed interest in luxury villa booking.',
        }
        response = self.client.post('/api/leads/queue/disposition/', data=data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['whatsapp_dispatched'])
        
        # Verify lead state updated
        self.lead2.refresh_from_db()
        self.assertEqual(self.lead2.status, 'interested')
        self.assertEqual(self.lead2.last_call_duration, 145)

        # Check ActivityLog
        call_log = ActivityLog.objects.filter(lead=self.lead2, activity_type='call').first()
        self.assertIsNotNone(call_log)
        self.assertEqual(call_log.call_duration_seconds, 145)

        wa_log = ActivityLog.objects.filter(lead=self.lead2, activity_type='whatsapp_dispatched').first()
        self.assertIsNotNone(wa_log)
        self.assertIn('Guest Two', wa_log.whatsapp_message_body)

        # Verify next lead is lead1
        self.assertIsNotNone(response.data['next_lead'])
        self.assertEqual(response.data['next_lead']['id'], self.lead1.id)

    def test_escalation_rules_and_breach_counters(self):
        # Set lead1 created_at to 50 hours ago (should trigger Day 2 Level 1 Escalation)
        old_time = timezone.now() - timedelta(hours=50)
        Lead.objects.filter(pk=self.lead1.pk).update(created_at=old_time)

        result = EscalationService.evaluate_all_leads()
        self.lead1.refresh_from_db()

        self.assertEqual(self.lead1.escalation_level, 'level1_manager')
        self.assertTrue(self.lead1.is_escalated)
        self.assertEqual(self.lead1.support_breach_count, 1)

    def test_reassignment_power(self):
        # Manager reassigns lead1 from support1 to support2
        self.client.force_authenticate(user=self.manager)
        data = {
            'reassign_to_user_id': self.support2.id,
            'notes': 'Reassigning due to staff shift change.'
        }
        response = self.client.post(f'/api/leads/{self.lead1.id}/reassign/', data=data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.lead1.refresh_from_db()
        self.assertEqual(self.lead1.assigned_to, self.support2)

        # Verify activity log
        reassigned_log = ActivityLog.objects.filter(lead=self.lead1, activity_type='reassigned').first()
        self.assertIsNotNone(reassigned_log)
        self.assertIn('Reassigning due to staff shift change.', reassigned_log.notes)

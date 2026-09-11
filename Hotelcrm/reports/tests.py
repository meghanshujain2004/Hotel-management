from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from leads.models import Lead, ActivityLog

User = get_user_model()


class ReportsAppTests(APITestCase):
    def setUp(self):
        # Create users
        self.admin = User.objects.create_superuser(
            username='admin_report',
            email='admin@test.com',
            password='password123',
            role='admin',
            phone='+919888800001'
        )
        self.manager = User.objects.create_user(
            username='manager_report',
            email='manager@test.com',
            password='password123',
            role='manager',
            phone='+919888800002'
        )
        self.support = User.objects.create_user(
            username='support_report',
            email='support@test.com',
            password='password123',
            role='support',
            phone='+919888800003'
        )

        # Create test leads
        self.lead1 = Lead.objects.create(
            guest_name='Guest Alpha',
            phone='+919888811111',
            source='instagram',
            status='registered',
            priority='high',
            assigned_to=self.support,
            assigned_manager=self.manager
        )
        self.lead2 = Lead.objects.create(
            guest_name='Guest Beta',
            phone='+919888822222',
            source='website',
            status='new',
            priority='urgent',
            assigned_to=self.support,
            assigned_manager=self.manager,
            escalation_level='level1_manager',
            is_escalated=True,
            support_breach_count=1
        )

        # Log calls
        ActivityLog.objects.create(
            lead=self.lead1,
            user=self.support,
            activity_type='call',
            call_duration_seconds=120,
            notes='Booking finalized.'
        )

    def test_dashboard_overview_metrics(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/reports/dashboard-overview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['kpi_cards']['total_leads'], 2)
        self.assertEqual(data['kpi_cards']['total_registered'], 1)
        self.assertEqual(data['kpi_cards']['conversion_rate_percentage'], 50.0)
        self.assertEqual(data['kpi_cards']['active_escalations'], 1)
        self.assertEqual(data['kpi_cards']['level1_support_inaction'], 1)
        self.assertEqual(data['kpi_cards']['total_sla_breaches'], 1)
        self.assertEqual(data['kpi_cards']['avg_call_duration_seconds'], 120)

        # Check sources breakdown
        sources = {item['source']: item['count'] for item in data['sources_breakdown']}
        self.assertEqual(sources.get('instagram'), 1)
        self.assertEqual(sources.get('website'), 1)

    def test_team_performance_leaderboard(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/reports/team-performance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        support_agents = response.data['support_agents']
        self.assertGreaterEqual(len(support_agents), 1)

        support_stat = next(s for s in support_agents if s['username'] == 'support_report')
        self.assertEqual(support_stat['leads_assigned'], 2)
        self.assertEqual(support_stat['registered_count'], 1)
        self.assertEqual(support_stat['conversion_rate_percentage'], 50.0)
        self.assertEqual(support_stat['calls_logged'], 1)
        self.assertEqual(support_stat['support_breach_count'], 1)

        managers = response.data['managers']
        manager_stat = next(m for m in managers if m['username'] == 'manager_report')
        self.assertEqual(manager_stat['leads_overseeing'], 2)
        self.assertEqual(manager_stat['team_registered_count'], 1)
        self.assertEqual(manager_stat['team_conversion_percentage'], 50.0)

    def test_staff_individual_stats(self):
        self.client.force_authenticate(user=self.support)
        # Support agent viewing own stats -> Allowed
        response = self.client.get(f'/api/reports/staff/{self.support.id}/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'support_report')

        # Support agent viewing manager stats -> Forbidden (403)
        response = self.client.get(f'/api/reports/staff/{self.manager.id}/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_report_csv_export(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/reports/export/?type=all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('CUSTOMER SUPPORT PERFORMANCE REPORT', response.content.decode('utf-8'))
        self.assertIn('support_report', response.content.decode('utf-8'))
        self.assertIn('manager_report', response.content.decode('utf-8'))

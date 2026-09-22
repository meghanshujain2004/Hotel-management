import csv
import io
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q
from django.contrib.auth import get_user_model
from leads.models import Lead, ActivityLog

User = get_user_model()


class ExecutiveDashboardService:
    @staticmethod
    def get_date_filter(period: str = 'all'):
        now = timezone.now()
        if period == 'today':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            return Q(created_at__gte=start)
        elif period == 'this_week':
            start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            return Q(created_at__gte=start)
        elif period == 'this_month':
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return Q(created_at__gte=start)
        elif period == 'this_year':
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            return Q(created_at__gte=start)
        return Q()

    @classmethod
    def get_dashboard_metrics(cls, period: str = 'all'):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        date_q = cls.get_date_filter(period)
        leads_qs = Lead.objects.filter(date_q)

        total_leads = leads_qs.count()
        today_converted = Lead.objects.filter(status='registered', updated_at__gte=today_start).count()
        month_converted = Lead.objects.filter(status='registered', updated_at__gte=month_start).count()
        total_registered = leads_qs.filter(status='registered').count()

        active_escalations = Lead.objects.filter(is_escalated=True).count()
        level1_support_inaction = Lead.objects.filter(escalation_level='level1_manager', is_escalated=True).count()
        level2_admin_critical = Lead.objects.filter(escalation_level='level2_admin', is_escalated=True).count()

        total_breaches = (
            Lead.objects.aggregate(
                total_support=Sum('support_breach_count'),
                total_manager=Sum('manager_breach_count')
            )
        )
        total_breach_count = (total_breaches.get('total_support') or 0) + (total_breaches.get('total_manager') or 0)

        # Average Call Duration
        avg_call_duration = ActivityLog.objects.filter(
            activity_type__in=['call', 'disposition'],
            call_duration_seconds__gt=0
        ).aggregate(avg_sec=Avg('call_duration_seconds'))['avg_sec'] or 0

        # Overall Conversion Rate %
        conversion_rate = round((total_registered / total_leads * 100), 1) if total_leads > 0 else 0.0

        # Lead Sources Breakdown
        source_counts = dict(leads_qs.values_list('source').annotate(count=Count('id')))
        sources_breakdown = []
        for code, label in Lead.SOURCE_CHOICES:
            count = source_counts.get(code, 0)
            pct = round((count / total_leads * 100), 1) if total_leads > 0 else 0.0
            sources_breakdown.append({
                'source': code,
                'source_display': label,
                'count': count,
                'percentage': pct,
            })

        # Pipeline Status Funnel
        status_counts = dict(leads_qs.values_list('status').annotate(count=Count('id')))
        funnel = []
        for code, label in Lead.STATUS_CHOICES:
            funnel.append({
                'status': code,
                'status_display': label,
                'count': status_counts.get(code, 0),
            })

        # Recent activities (last 10)
        recent_activities = ActivityLog.objects.select_related('lead', 'user').order_by('-created_at')[:10]
        activities_data = [
            {
                'id': a.id,
                'lead_id': a.lead.id,
                'guest_name': a.lead.guest_name,
                'user_name': a.user.username if a.user else 'System',
                'activity_type': a.activity_type,
                'activity_type_display': a.get_activity_type_display(),
                'notes': a.notes,
                'created_at': a.created_at,
            }
            for a in recent_activities
        ]

        return {
            'period': period,
            'kpi_cards': {
                'total_leads': total_leads,
                'today_converted': today_converted,
                'month_converted': month_converted,
                'total_registered': total_registered,
                'conversion_rate_percentage': conversion_rate,
                'active_escalations': active_escalations,
                'level1_support_inaction': level1_support_inaction,
                'level2_admin_critical': level2_admin_critical,
                'total_sla_breaches': total_breach_count,
                'avg_call_duration_seconds': int(avg_call_duration),
            },
            'sources_breakdown': sources_breakdown,
            'funnel': funnel,
            'recent_activities': activities_data,
        }


class TeamPerformanceService:
    @classmethod
    def get_support_agent_stats(cls, user):
        leads = Lead.objects.filter(assigned_to=user)
        total_assigned = leads.count()
        registered_count = leads.filter(status='registered').count()
        conversion_rate = round((registered_count / total_assigned * 100), 1) if total_assigned > 0 else 0.0

        calls_logged = ActivityLog.objects.filter(user=user, activity_type__in=['call', 'disposition']).count()
        avg_duration = ActivityLog.objects.filter(
            user=user,
            activity_type__in=['call', 'disposition'],
            call_duration_seconds__gt=0
        ).aggregate(avg_sec=Avg('call_duration_seconds'))['avg_sec'] or 0

        support_breaches = leads.aggregate(total_b=Sum('support_breach_count'))['total_b'] or 0
        active_escalations = leads.filter(is_escalated=True).count()

        assigned_leads_list = []
        for lead in leads.select_related('assigned_to', 'assigned_manager')[:50]:
            sec = getattr(lead, 'last_call_duration', 0) or 0
            dur_str = f"{sec // 60}m {sec % 60}s" if sec > 0 else "0m 0s"
            notes_str = getattr(lead, 'last_disposition_note', '') or getattr(lead, 'inquiry_details', '') or 'No notes recorded'
            assigned_leads_list.append({
                'id': lead.id,
                'guest_name': lead.guest_name,
                'phone': getattr(lead, 'phone', ''),
                'lead_source': lead.get_source_display() if hasattr(lead, 'get_source_display') else getattr(lead, 'source', 'direct'),
                'status': lead.get_status_display() if hasattr(lead, 'get_status_display') else getattr(lead, 'status', 'new'),
                'call_duration': dur_str,
                'followup_date': lead.followup_date_time.strftime('%Y-%m-%d %H:%M') if lead.followup_date_time else 'N/A',
                'notes': notes_str,
            })

        return {
            'id': user.id,
            'user_id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'leads_assigned': total_assigned,
            'assigned_leads_count': total_assigned,
            'calls_logged': calls_logged,
            'calls_completed': calls_logged,
            'avg_call_duration_seconds': int(avg_duration),
            'avg_call_duration_display': f"{int(avg_duration // 60)}m {int(avg_duration % 60)}s",
            'registered_count': registered_count,
            'conversion_rate_percentage': conversion_rate,
            'conversion_rate': conversion_rate,
            'support_breach_count': support_breaches,
            'sla_breach_count': support_breaches,
            'active_escalations': active_escalations,
            'assigned_leads': assigned_leads_list,
        }

    @classmethod
    def get_manager_stats(cls, user):
        leads = Lead.objects.filter(assigned_manager=user)
        total_overseeing = leads.count()
        registered_count = leads.filter(status='registered').count()
        conversion_rate = round((registered_count / total_overseeing * 100), 1) if total_overseeing > 0 else 0.0

        supervised_agents = User.objects.filter(
            role='support',
            assigned_leads__assigned_manager=user
        ).distinct().count()

        manager_breaches = leads.aggregate(total_b=Sum('manager_breach_count'))['total_b'] or 0
        active_escalations = leads.filter(is_escalated=True).count()

        assigned_leads_list = []
        for lead in leads.select_related('assigned_to', 'assigned_manager')[:50]:
            sec = getattr(lead, 'last_call_duration', 0) or 0
            dur_str = f"{sec // 60}m {sec % 60}s" if sec > 0 else "0m 0s"
            notes_str = getattr(lead, 'last_disposition_note', '') or getattr(lead, 'inquiry_details', '') or 'No notes recorded'
            assigned_leads_list.append({
                'id': lead.id,
                'guest_name': lead.guest_name,
                'phone': getattr(lead, 'phone', ''),
                'lead_source': lead.get_source_display() if hasattr(lead, 'get_source_display') else getattr(lead, 'source', 'direct'),
                'status': lead.get_status_display() if hasattr(lead, 'get_status_display') else getattr(lead, 'status', 'new'),
                'call_duration': dur_str,
                'followup_date': lead.followup_date_time.strftime('%Y-%m-%d %H:%M') if lead.followup_date_time else 'N/A',
                'notes': notes_str,
            })

        return {
            'id': user.id,
            'user_id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'leads_overseeing': total_overseeing,
            'total_supervised_leads': total_overseeing,
            'supervised_agents_count': supervised_agents,
            'team_registered_count': registered_count,
            'registered_leads_count': registered_count,
            'team_conversion_percentage': conversion_rate,
            'team_conversion_rate': conversion_rate,
            'manager_critical_breaches': manager_breaches,
            'level1_overdue_count': manager_breaches,
            'active_escalations': active_escalations,
            'assigned_leads': assigned_leads_list,
        }

    @classmethod
    def get_team_leaderboard(cls):
        support_users = User.objects.filter(role='support', is_active=True).order_by('username')
        manager_users = User.objects.filter(role='manager', is_active=True).order_by('username')

        support_stats = [cls.get_support_agent_stats(u) for u in support_users]
        manager_stats = [cls.get_manager_stats(u) for u in manager_users]

        return {
            'support_agents': support_stats,
            'managers': manager_stats,
            'support_leaderboard': support_stats,
            'manager_leaderboard': manager_stats,
        }


class ReportExportService:
    @classmethod
    def generate_csv_report(cls, report_type: str = 'all'):
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type in ['support', 'all']:
            writer.writerow(['CUSTOMER SUPPORT PERFORMANCE REPORT'])
            writer.writerow(['Agent ID', 'Username', 'Full Name', 'Email', 'Phone', 'Leads Assigned', 'Calls Logged', 'Avg Duration (s)', 'Converted Leads', 'Conversion Rate %', 'SLA Inaction Breaches', 'Active Escalations'])
            support_users = User.objects.filter(role='support', is_active=True)
            for u in support_users:
                s = TeamPerformanceService.get_support_agent_stats(u)
                writer.writerow([
                    s['user_id'], s['username'], s['full_name'], s['email'], s['phone'],
                    s['leads_assigned'], s['calls_logged'], s['avg_call_duration_seconds'],
                    s['registered_count'], s['conversion_rate_percentage'],
                    s['support_breach_count'], s['active_escalations']
                ])
            writer.writerow([])

        if report_type in ['managers', 'all']:
            writer.writerow(['SALES MANAGERS PERFORMANCE REPORT'])
            writer.writerow(['Manager ID', 'Username', 'Full Name', 'Email', 'Phone', 'Leads Overseeing', 'Supervised Staff', 'Team Converted', 'Team Conversion %', 'Critical Admin Breaches', 'Active Escalations'])
            manager_users = User.objects.filter(role='manager', is_active=True)
            for u in manager_users:
                m = TeamPerformanceService.get_manager_stats(u)
                writer.writerow([
                    m['user_id'], m['username'], m['full_name'], m['email'], m['phone'],
                    m['leads_overseeing'], m['supervised_agents_count'],
                    m['team_registered_count'], m['team_conversion_percentage'],
                    m['manager_critical_breaches'], m['active_escalations']
                ])

        return output.getvalue()

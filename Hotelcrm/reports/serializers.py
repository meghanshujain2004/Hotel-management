from rest_framework import serializers


class KPICardsSerializer(serializers.Serializer):
    total_leads = serializers.IntegerField()
    today_converted = serializers.IntegerField()
    month_converted = serializers.IntegerField()
    total_registered = serializers.IntegerField()
    conversion_rate_percentage = serializers.FloatField()
    active_escalations = serializers.IntegerField()
    level1_support_inaction = serializers.IntegerField()
    level2_admin_critical = serializers.IntegerField()
    total_sla_breaches = serializers.IntegerField()
    avg_call_duration_seconds = serializers.IntegerField()


class SourceBreakdownSerializer(serializers.Serializer):
    source = serializers.CharField()
    source_display = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class FunnelStageSerializer(serializers.Serializer):
    status = serializers.CharField()
    status_display = serializers.CharField()
    count = serializers.IntegerField()


class RecentActivityReportSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    lead_id = serializers.IntegerField()
    guest_name = serializers.CharField()
    user_name = serializers.CharField()
    activity_type = serializers.CharField()
    activity_type_display = serializers.CharField()
    notes = serializers.CharField()
    created_at = serializers.DateTimeField()


class DashboardOverviewResponseSerializer(serializers.Serializer):
    period = serializers.CharField()
    kpi_cards = KPICardsSerializer()
    sources_breakdown = SourceBreakdownSerializer(many=True)
    funnel = FunnelStageSerializer(many=True)
    recent_activities = RecentActivityReportSerializer(many=True)


class SupportAgentStatsSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    role = serializers.CharField()
    leads_assigned = serializers.IntegerField()
    calls_logged = serializers.IntegerField()
    avg_call_duration_seconds = serializers.IntegerField()
    avg_call_duration_display = serializers.CharField()
    registered_count = serializers.IntegerField()
    conversion_rate_percentage = serializers.FloatField()
    support_breach_count = serializers.IntegerField()
    active_escalations = serializers.IntegerField()


class ManagerStatsSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    role = serializers.CharField()
    leads_overseeing = serializers.IntegerField()
    supervised_agents_count = serializers.IntegerField()
    team_registered_count = serializers.IntegerField()
    team_conversion_percentage = serializers.FloatField()
    manager_critical_breaches = serializers.IntegerField()
    active_escalations = serializers.IntegerField()


class TeamPerformanceResponseSerializer(serializers.Serializer):
    support_agents = SupportAgentStatsSerializer(many=True)
    managers = ManagerStatsSerializer(many=True)

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Lead, ActivityLog, WhatsAppTemplate
from users.serializers import UserSerializer

User = get_user_model()


class WhatsAppTemplateSerializer(serializers.ModelSerializer):
    trigger_display = serializers.CharField(source='get_outcome_trigger_display', read_only=True)

    class Meta:
        model = WhatsAppTemplate
        fields = ['id', 'name', 'outcome_trigger', 'trigger_display', 'template_body', 'is_active', 'created_at', 'updated_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    disposition_display = serializers.CharField(source='get_disposition_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'lead', 'user', 'user_name', 'activity_type', 'activity_type_display',
            'disposition', 'disposition_display', 'call_duration_seconds', 'notes',
            'whatsapp_template_name', 'whatsapp_message_body', 'whatsapp_status', 'created_at'
        ]


class LeadListSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_manager_name = serializers.CharField(source='assigned_manager.username', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    escalation_level_display = serializers.CharField(source='get_escalation_level_display', read_only=True)
    overdue_duration = serializers.CharField(source='overdue_duration_display', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'guest_name', 'phone', 'email', 'source', 'source_display',
            'inquiry_details', 'status', 'status_display', 'priority', 'priority_display',
            'assigned_to', 'assigned_to_name', 'assigned_manager', 'assigned_manager_name',
            'followup_date_time', 'last_contacted_at', 'last_call_duration', 'last_disposition_note',
            'escalation_level', 'escalation_level_display', 'is_escalated', 'is_overdue',
            'overdue_duration', 'support_breach_count', 'manager_breach_count', 'reassigned_notice',
            'created_at', 'updated_at'
        ]


class LeadDetailSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    assigned_manager_detail = UserSerializer(source='assigned_manager', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    escalation_level_display = serializers.CharField(source='get_escalation_level_display', read_only=True)
    overdue_duration = serializers.CharField(source='overdue_duration_display', read_only=True)
    activities = ActivityLogSerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'guest_name', 'phone', 'email', 'source', 'source_display',
            'inquiry_details', 'status', 'status_display', 'priority', 'priority_display',
            'assigned_to', 'assigned_to_detail', 'assigned_manager', 'assigned_manager_detail',
            'followup_date_time', 'last_contacted_at', 'last_call_duration', 'last_disposition_note',
            'escalation_level', 'escalation_level_display', 'is_escalated', 'is_overdue',
            'overdue_duration', 'support_breach_count', 'manager_breach_count', 'reassigned_notice',
            'activities', 'created_at', 'updated_at'
        ]


class LeadCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            'id', 'guest_name', 'phone', 'email', 'source', 'inquiry_details',
            'status', 'priority', 'assigned_to', 'assigned_manager',
            'followup_date_time'
        ]

    def create(self, validated_data):
        lead = super().create(validated_data)
        user = self.context['request'].user if 'request' in self.context else None
        ActivityLog.objects.create(
            lead=lead,
            user=user,
            activity_type='created',
            notes=f"Lead entered into system via {lead.get_source_display()}."
        )
        return lead


class DispositionSubmitSerializer(serializers.Serializer):
    lead_id = serializers.IntegerField(required=True)
    disposition = serializers.ChoiceField(choices=Lead.STATUS_CHOICES, required=True)
    call_duration_seconds = serializers.IntegerField(default=0, min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    followup_date_time = serializers.DateTimeField(required=False, allow_null=True)

    def validate_lead_id(self, value):
        try:
            lead = Lead.objects.get(pk=value)
        except Lead.DoesNotExist:
            raise serializers.ValidationError("Lead does not exist.")
        return value


class ReassignLeadSerializer(serializers.Serializer):
    reassign_to_user_id = serializers.IntegerField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_reassign_to_user_id(self, value):
        try:
            target_user = User.objects.get(pk=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Target user not found.")
        
        request = self.context.get('request')
        if request and request.user:
            actor = request.user
            # Admin can reassign to any Manager or Support
            # Manager can reassign to Support
            if actor.role == 'manager' and target_user.role not in ['support']:
                raise serializers.ValidationError("Managers can only reassign leads to Customer Support agents.")
        return value


class ActivityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['activity_type', 'disposition', 'call_duration_seconds', 'notes']

    def create(self, validated_data):
        lead = self.context['lead']
        user = self.context['request'].user
        return ActivityLog.objects.create(lead=lead, user=user, **validated_data)

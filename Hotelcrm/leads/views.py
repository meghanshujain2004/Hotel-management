from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status, viewsets, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsAdminRole, IsManagerRole, IsSupportRole
from .models import Lead, ActivityLog, WhatsAppTemplate
from .serializers import (
    LeadListSerializer,
    LeadDetailSerializer,
    LeadCreateUpdateSerializer,
    ActivityLogSerializer,
    ActivityCreateSerializer,
    DispositionSubmitSerializer,
    ReassignLeadSerializer,
    WhatsAppTemplateSerializer
)
from .services import (
    QueueService,
    DispositionService,
    EscalationService,
    ReassignmentService,
    WhatsAppService
)


class LeadViewSet(viewsets.ModelViewSet):
    """
    Master Lead Directory (Web Screen 3 & Mobile Screen 9):
    List, filter, create, update, and delete leads.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['guest_name', 'phone', 'email', 'inquiry_details']
    ordering_fields = ['created_at', 'priority', 'last_contacted_at', 'followup_date_time']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Lead.objects.all().select_related('assigned_to', 'assigned_manager')

        # Filter query params
        status_param = self.request.query_params.get('status')
        source_param = self.request.query_params.get('source')
        priority_param = self.request.query_params.get('priority')
        assigned_to_param = self.request.query_params.get('assigned_to')
        assigned_manager_param = self.request.query_params.get('assigned_manager')
        is_escalated_param = self.request.query_params.get('is_escalated')
        escalation_level_param = self.request.query_params.get('escalation_level')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if source_param:
            queryset = queryset.filter(source=source_param)
        if priority_param:
            queryset = queryset.filter(priority=priority_param)
        if assigned_to_param:
            queryset = queryset.filter(assigned_to_id=assigned_to_param)
        if assigned_manager_param:
            queryset = queryset.filter(assigned_manager_id=assigned_manager_param)
        if is_escalated_param is not None:
            queryset = queryset.filter(is_escalated=is_escalated_param.lower() == 'true')
        if escalation_level_param:
            queryset = queryset.filter(escalation_level=escalation_level_param)

        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LeadDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LeadCreateUpdateSerializer
        return LeadListSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdminRole()]
        return [IsAuthenticated()]


class ActiveQueueView(APIView):
    """
    Customer Support Calling Workspace (Screen 5):
    Returns the single active lead to call next in sequential queue.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        active_lead, total_in_queue = QueueService.get_active_lead_for_user(user)

        if not active_lead:
            return Response({
                'message': 'No leads currently pending in your calling queue.',
                'active_lead': None,
                'total_in_queue': 0,
            }, status=status.HTTP_200_OK)

        serializer = LeadDetailSerializer(active_lead)
        response_data = {
            'active_lead': serializer.data,
            'total_in_queue': total_in_queue,
            'reassigned_notice': active_lead.reassigned_notice,
        }

        # Clear notice once delivered
        if active_lead.reassigned_notice:
            active_lead.reassigned_notice = ""
            active_lead.save(update_fields=['reassigned_notice'])

        return Response(response_data, status=status.HTTP_200_OK)


class DispositionSubmitView(APIView):
    """
    Post-Call Disposition Modal (Screen 5):
    Logs call duration & notes, updates status, auto-triggers guest WhatsApp template,
    and returns next lead immediately.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DispositionSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lead_id = serializer.validated_data['lead_id']
        disposition_status = serializer.validated_data['disposition']
        call_duration = serializer.validated_data['call_duration_seconds']
        notes = serializer.validated_data['notes']
        followup_date_time = serializer.validated_data.get('followup_date_time')

        lead = get_object_or_404(Lead, pk=lead_id)

        result = DispositionService.handle_disposition(
            lead=lead,
            user=request.user,
            disposition_status=disposition_status,
            call_duration=call_duration,
            notes=notes,
            followup_date_time=followup_date_time
        )

        next_lead_data = LeadDetailSerializer(result['next_lead']).data if result['next_lead'] else None

        return Response({
            'message': f"Disposition '{lead.get_status_display()}' saved successfully.",
            'whatsapp_dispatched': result['whatsapp_dispatched'],
            'whatsapp_log': ActivityLogSerializer(result['whatsapp_log']).data if result['whatsapp_log'] else None,
            'next_lead': next_lead_data,
            'remaining_in_queue': result['remaining_in_queue'],
        }, status=status.HTTP_200_OK)


class LeadTimelineView(APIView):
    """
    Interactive Activity Timeline (Screen 4):
    Get chronological history or post a new note/activity.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        activities = lead.activities.all().select_related('user').order_by('-created_at')
        serializer = ActivityLogSerializer(activities, many=True)
        return Response({
            'lead_id': lead.id,
            'guest_name': lead.guest_name,
            'activities': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        serializer = ActivityCreateSerializer(data=request.data, context={'lead': lead, 'request': request})
        serializer.is_valid(raise_exception=True)
        activity = serializer.save()
        return Response(ActivityLogSerializer(activity).data, status=status.HTTP_201_CREATED)


class ReassignLeadView(APIView):
    """
    Reassignment Power (Screen 6 & Screen 8):
    Admin can reassign to any Manager; Manager can reassign to any Support agent.
    """
    permission_classes = [IsManagerRole]

    def post(self, request, pk):
        lead = get_object_or_404(Lead, pk=pk)
        serializer = ReassignLeadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = User.objects.get(pk=serializer.validated_data['reassign_to_user_id'])
        notes = serializer.validated_data.get('notes', '')

        updated_lead = ReassignmentService.reassign_lead(
            lead=lead,
            new_user=target_user,
            acting_user=request.user,
            notes=notes
        )

        return Response({
            'message': f"Lead successfully reassigned to {target_user.username} ({target_user.role}).",
            'lead': LeadDetailSerializer(updated_lead).data
        }, status=status.HTTP_200_OK)


class EscalationFeedView(APIView):
    """
    Manager & Admin Escalation & SLA Monitoring Dashboard (Screen 6 & Screen 8):
    Overdue leads feed with Level 1 vs Level 2 filters, SLA overdue timers, and metrics.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        level_filter = request.query_params.get('level')  # 'all', 'level1_manager', 'level2_admin'
        
        qs = Lead.objects.filter(is_escalated=True).select_related('assigned_to', 'assigned_manager').order_by('-escalation_date')

        if level_filter == 'level1':
            qs = qs.filter(escalation_level='level1_manager')
        elif level_filter == 'level2':
            qs = qs.filter(escalation_level='level2_admin')

        # Metrics calculation
        total_escalated = Lead.objects.filter(is_escalated=True).count()
        level1_count = Lead.objects.filter(escalation_level='level1_manager', is_escalated=True).count()
        level2_count = Lead.objects.filter(escalation_level='level2_admin', is_escalated=True).count()

        serializer = LeadListSerializer(qs, many=True)
        return Response({
            'metrics': {
                'total_escalated': total_escalated,
                'level1_support_inaction': level1_count,
                'level2_admin_critical': level2_count,
            },
            'escalations': serializer.data
        }, status=status.HTTP_200_OK)


class CheckEscalationsView(APIView):
    """
    Trigger automated 4-Day SLA Escalation evaluation engine across all active leads.
    """
    permission_classes = [IsAdminRole]

    def post(self, request):
        result = EscalationService.evaluate_all_leads()
        return Response({
            'message': 'SLA Escalation evaluation completed.',
            'result': result
        }, status=status.HTTP_200_OK)


class WhatsAppTemplateViewSet(viewsets.ModelViewSet):
    """
    WhatsApp Template Management for Admin (Section 4):
    CRUD for outcome-based and escalation WhatsApp templates.
    """
    queryset = WhatsAppTemplate.objects.all()
    serializer_class = WhatsAppTemplateSerializer
    permission_classes = [IsAdminRole]

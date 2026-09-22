from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet,
    ActiveQueueView,
    DispositionSubmitView,
    LeadTimelineView,
    ReassignLeadView,
    EscalationFeedView,
    CheckEscalationsView,
    WhatsAppTemplateViewSet,
    DueFollowupsView,
    SendTemplateMessageView,
)

router = DefaultRouter()
router.register(r'templates', WhatsAppTemplateViewSet, basename='whatsapp-template')
router.register(r'', LeadViewSet, basename='lead')

urlpatterns = [
    # Customer Support Calling Workspace (Screen 5)
    path('queue/active/', ActiveQueueView.as_view(), name='queue-active'),
    path('queue/disposition/', DispositionSubmitView.as_view(), name='queue-disposition'),

    # Scheduled Follow-ups Due Reminders
    path('followups/due/', DueFollowupsView.as_view(), name='followups-due'),

    # Meta WhatsApp Template Dispatches
    path('whatsapp/send-template/', SendTemplateMessageView.as_view(), name='whatsapp-send-template'),

    # Escalations & SLA Monitoring (Screen 6 & Screen 8)
    path('escalations/', EscalationFeedView.as_view(), name='escalations-feed'),
    path('check-escalations/', CheckEscalationsView.as_view(), name='check-escalations'),

    # Lead Activities & Timeline (Screen 4)
    path('<int:pk>/timeline/', LeadTimelineView.as_view(), name='lead-timeline'),

    # Lead Reassignment Power
    path('<int:pk>/reassign/', ReassignLeadView.as_view(), name='lead-reassign'),

    # ViewSets (Templates & Leads CRUD)
    path('', include(router.urls)),
]

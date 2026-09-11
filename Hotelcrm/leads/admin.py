from django.contrib import admin
from .models import Lead, ActivityLog, WhatsAppTemplate


class ActivityLogInline(admin.TabularInline):
    model = ActivityLog
    extra = 0
    readonly_fields = ('created_at', 'activity_type', 'disposition', 'call_duration_seconds', 'user', 'notes', 'whatsapp_template_name', 'whatsapp_status')
    can_delete = False


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        'guest_name', 'phone', 'source', 'status', 'priority',
        'assigned_to', 'assigned_manager', 'escalation_level',
        'is_escalated', 'created_at'
    )
    list_filter = (
        'status', 'source', 'priority', 'escalation_level',
        'is_escalated', 'assigned_to', 'assigned_manager'
    )
    search_fields = ('guest_name', 'phone', 'email', 'inquiry_details')
    readonly_fields = ('created_at', 'updated_at', 'is_overdue', 'overdue_duration_display')
    inlines = [ActivityLogInline]

    fieldsets = (
        ('Guest Information', {
            'fields': ('guest_name', 'phone', 'email', 'source', 'inquiry_details')
        }),
        ('Assignment & Pipeline', {
            'fields': ('status', 'priority', 'assigned_to', 'assigned_manager', 'followup_date_time')
        }),
        ('Last Call / Disposition Info', {
            'fields': ('last_contacted_at', 'last_call_duration', 'last_disposition_note', 'reassigned_notice')
        }),
        ('SLA & Escalation Engine', {
            'fields': (
                'escalation_level', 'is_escalated', 'escalation_date',
                'support_breach_count', 'manager_breach_count',
                'is_overdue', 'overdue_duration_display'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('lead', 'user', 'activity_type', 'disposition', 'call_duration_seconds', 'whatsapp_template_name', 'created_at')
    list_filter = ('activity_type', 'disposition', 'whatsapp_status', 'created_at')
    search_fields = ('lead__guest_name', 'lead__phone', 'notes', 'whatsapp_message_body')
    readonly_fields = ('created_at',)


@admin.register(WhatsAppTemplate)
class WhatsAppTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'outcome_trigger', 'is_active', 'updated_at')
    list_filter = ('outcome_trigger', 'is_active')
    search_fields = ('name', 'template_body')

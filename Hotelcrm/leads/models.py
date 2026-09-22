from django.db import models
from django.conf import settings
from django.utils import timezone


class WhatsAppTemplate(models.Model):
    TRIGGER_CHOICES = [
        ('interested', 'Interested (Brochure & Offer)'),
        ('awaiting_followup', 'Awaiting Follow-up (Callback Confirmation)'),
        ('completed_followup', 'Completed Follow-up'),
        ('registered', 'Registered / Converted (Welcome & Booking)'),
        ('not_interested', 'Not Interested (Future Membership)'),
        ('lost', 'Lost / Junk'),
        ('escalation_day1', 'Day 1 Support Inaction Reminder'),
        ('escalation_day2', 'Day 2 Level 1 Manager Escalation Alert'),
        ('escalation_day3', 'Day 3 Manager Inaction Reminder'),
        ('escalation_day4', 'Day 4 Level 2 Admin Critical Escalation Alert'),
        ('reassignment_alert', 'Reassignment Alert to Staff'),
    ]

    name = models.CharField(max_length=100, unique=True)
    meta_template_name = models.CharField(max_length=100, blank=True, help_text="Approved template name in Meta Manager (e.g. hotel_booking_offer)")
    language_code = models.CharField(max_length=10, default='en', help_text="Meta language code (e.g. en, en_US, hi)")
    outcome_trigger = models.CharField(max_length=50, choices=TRIGGER_CHOICES, unique=True)
    template_body = models.TextField(
        help_text="Placeholders available: {guest_name}, {phone}, {followup_date_time}, {gallery_url}, {booking_code}, {staff_name}, {manager_name}, {hotel_name}"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_outcome_trigger_display()})"


class WhatsAppMessageLog(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
    ]

    lead = models.ForeignKey('Lead', on_delete=models.CASCADE, related_name='whatsapp_logs', null=True, blank=True)
    recipient_phone = models.CharField(max_length=20)
    template_name = models.CharField(max_length=100)
    language_code = models.CharField(max_length=10, default='en')
    rendered_body = models.TextField()
    meta_message_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    error_details = models.TextField(blank=True, null=True)
    dispatched_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"WhatsApp to {self.recipient_phone} ({self.template_name}) - {self.status}"


class Lead(models.Model):
    SOURCE_CHOICES = [
        ('instagram', 'Instagram Lead Ads'),
        ('whatsapp', 'WhatsApp Business'),
        ('facebook', 'Facebook Ads'),
        ('website', 'Website Form'),
        ('manual', 'Manual Entry'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('interested', 'Interested'),
        ('awaiting_followup', 'Awaiting Follow-up'),
        ('completed_followup', 'Completed Follow-up'),
        ('registered', 'Registered / Converted'),
        ('not_interested', 'Not Interested'),
        ('lost', 'Lost / Junk'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    ESCALATION_LEVEL_CHOICES = [
        ('normal', 'Normal'),
        ('day1_reminder', 'Day 1 Support Reminder (24h)'),
        ('level1_manager', 'Level 1 Manager Escalation (48h)'),
        ('day3_reminder', 'Day 3 Manager Reminder (72h)'),
        ('level2_admin', 'Level 2 Admin Critical (96h)'),
    ]

    # Guest Profile
    guest_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True, null=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='website')
    inquiry_details = models.TextField(blank=True, help_text="Room type, dates, budget, or inquiry notes")

    # Lead Status & Queue
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new', db_index=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', db_index=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='assigned_leads',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Customer Support Agent"
    )
    assigned_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='manager_leads',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Supervising Manager"
    )

    # Activity Timestamps
    followup_date_time = models.DateTimeField(null=True, blank=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    last_call_duration = models.PositiveIntegerField(default=0, help_text="Duration in seconds of the latest call")
    last_disposition_note = models.TextField(blank=True)

    # SLA & Escalations
    escalation_level = models.CharField(
        max_length=20,
        choices=ESCALATION_LEVEL_CHOICES,
        default='normal',
        db_index=True
    )
    is_escalated = models.BooleanField(default=False, db_index=True)
    escalation_date = models.DateTimeField(null=True, blank=True)
    support_breach_count = models.PositiveIntegerField(default=0)
    manager_breach_count = models.PositiveIntegerField(default=0)
    reassigned_notice = models.CharField(
        max_length=255,
        blank=True,
        help_text="Notice for agent if previous lead was reassigned by manager"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.guest_name} ({self.phone}) - {self.get_status_display()}"

    @property
    def is_overdue(self):
        if self.status in ['registered', 'not_interested', 'lost']:
            return False
        return self.escalation_level in ['level1_manager', 'level2_admin']

    @property
    def overdue_duration_display(self):
        if not self.is_escalated or not self.escalation_date:
            return None
        diff = timezone.now() - self.escalation_date
        days = diff.days
        hours = diff.seconds // 3600
        return f"{days}d {hours}h overdue"


class ActivityLog(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ('call', 'Phone Call'),
        ('disposition', 'Post-Call Disposition'),
        ('whatsapp_dispatched', 'WhatsApp Dispatched'),
        ('reassigned', 'Lead Reassigned'),
        ('escalated', 'SLA Escalation'),
        ('note', 'Manual Note'),
        ('created', 'Lead Created'),
    ]

    lead = models.ForeignKey(Lead, related_name='activities', on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='lead_activities',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPE_CHOICES, default='note')
    disposition = models.CharField(max_length=30, choices=Lead.STATUS_CHOICES, blank=True, null=True)
    call_duration_seconds = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    # WhatsApp Audit Info
    whatsapp_template_name = models.CharField(max_length=100, blank=True, null=True)
    whatsapp_message_body = models.TextField(blank=True, null=True)
    whatsapp_status = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_activity_type_display()}] {self.lead.guest_name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

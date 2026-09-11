from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from leads.models import Lead, ActivityLog, WhatsAppTemplate

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds initial WhatsApp templates, sample staff users, and sample leads for HotelCRM"

    def handle(self, *args, **options):
        self.stdout.write("Starting HotelCRM data seeding...")

        # 1. Seed WhatsApp Templates
        templates_data = [
            {
                'name': 'Guest Interested - Brochure & VIP 15% Code',
                'outcome_trigger': 'interested',
                'template_body': 'Hi {guest_name}! Thank you for speaking with {staff_name} at {hotel_name}. Here is our luxury resort brochure & room catalog: {gallery_url}. As discussed, use code *{booking_code}* for an exclusive 15% VIP direct booking discount. Reply to this chat anytime to confirm your stay dates!',
            },
            {
                'name': 'Follow-up Scheduled & Resort Gallery',
                'outcome_trigger': 'awaiting_followup',
                'template_body': 'Hi {guest_name}! Thank you for your time today with {hotel_name}. As requested, we have scheduled our follow-up call with you on {followup_date_time}. In the meantime, feel free to explore our resort gallery here: {gallery_url}.',
            },
            {
                'name': 'Follow-up Completed Summary',
                'outcome_trigger': 'completed_followup',
                'template_body': 'Dear {guest_name}, thank you for continuing your conversation with {hotel_name}. We look forward to welcoming you soon. Feel free to reply here if you have any questions before arrival.',
            },
            {
                'name': 'Registration Confirmed & VIP Welcome',
                'outcome_trigger': 'registered',
                'template_body': '🎉 Welcome to {hotel_name}, {guest_name}! Your stay registration is officially confirmed. Our concierge team is preparing for your arrival. We are delighted to host you!',
            },
            {
                'name': 'Polite Future Membership Offer',
                'outcome_trigger': 'not_interested',
                'template_body': 'Dear {guest_name}, thank you for speaking with {hotel_name}. We completely understand. If you plan a stay or holiday in the future, save this number for member-only seasonal discounts. Have a wonderful day!',
            },
            {
                'name': 'Day 1 Support Inaction Reminder',
                'outcome_trigger': 'escalation_day1',
                'template_body': '⏰ SLA Day 1 Reminder: You have not called Guest {guest_name} ({phone}). Please call today to avoid Level 1 Manager Escalation.',
            },
            {
                'name': 'Day 2 Level 1 Manager Escalation Alert',
                'outcome_trigger': 'escalation_day2',
                'template_body': '🚨 Escalation Alert (Level 1): Support agent {staff_name} has NOT called Guest {guest_name} ({phone}) for 2 days. Lead is now escalated to Manager {manager_name} queue (+1 Staff Breach).',
            },
            {
                'name': 'Day 3 Manager Inaction Reminder',
                'outcome_trigger': 'escalation_day3',
                'template_body': '⚠️ Manager Reminder (Day 3): Lead {guest_name} ({phone}) is pending action for 3 days. Please resolve or reassign to avoid Admin escalation.',
            },
            {
                'name': 'Day 4 Level 2 Admin Critical Escalation',
                'outcome_trigger': 'escalation_day4',
                'template_body': '🔥 CRITICAL ESCALATION (Level 2): Lead {guest_name} ({phone}) neglected by Support {staff_name} and Manager {manager_name} for 4 days. Immediate Admin intervention required (+1 Manager Breach).',
            },
            {
                'name': 'Lead Reassignment Notice to Staff',
                'outcome_trigger': 'reassignment_alert',
                'template_body': '📋 Lead Reassigned: Guest {guest_name} ({phone}) has been assigned to you by {manager_name}. Please review details and initiate contact promptly.',
            },
        ]

        for t in templates_data:
            obj, created = WhatsAppTemplate.objects.update_or_create(
                outcome_trigger=t['outcome_trigger'],
                defaults={
                    'name': t['name'],
                    'template_body': t['template_body'],
                    'is_active': True,
                }
            )
            action_str = "Created" if created else "Updated"
            self.stdout.write(f"  [WhatsApp Template] {action_str}: {obj.name}")

        # 2. Seed Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@luxuryresort.com',
                'role': 'admin',
                'phone': '+919800000001',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        manager_user, _ = User.objects.get_or_create(
            username='manager_vikram',
            defaults={
                'email': 'vikram.manager@luxuryresort.com',
                'role': 'manager',
                'phone': '+919800000002',
                'is_staff': True,
            }
        )
        manager_user.set_password('manager123')
        manager_user.save()

        support_agent1, _ = User.objects.get_or_create(
            username='rahul_support',
            defaults={
                'email': 'rahul.support@luxuryresort.com',
                'role': 'support',
                'phone': '+919800000003',
            }
        )
        support_agent1.set_password('support123')
        support_agent1.save()

        support_agent2, _ = User.objects.get_or_create(
            username='priya_support',
            defaults={
                'email': 'priya.support@luxuryresort.com',
                'role': 'support',
                'phone': '+919800000004',
            }
        )
        support_agent2.set_password('support123')
        support_agent2.save()

        self.stdout.write("  [Users] Admin, Manager, and Support agents seeded.")
        self.stdout.write(self.style.SUCCESS("HotelCRM setup completed successfully (Clean production database, 0 mock leads)."))


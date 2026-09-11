from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username','email','role','phone','is_active')
    list_filter = ('role','is_active','is_staff')
    search_fields = ('username','email','phone')
    
    fieldsets = UserAdmin.fieldsets +(('Extra Info',{'fields':('role','phone','profile_picture')}),)
    
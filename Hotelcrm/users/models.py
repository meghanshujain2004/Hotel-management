from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    role_choices=[
        ('admin','Admin'),
        ('manager','Manager'),
        ('support','Customer Support'),
    ]
    role= models.CharField(max_length=10,choices=role_choices,default='support')
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female')], default='male', blank=True, null=True)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    profile_picture= models.ImageField(upload_to="profile_pictures/" ,blank=True,null=True)

    def __str__(self):
        return f"{self.username} - {self.role}"

    
    @property
    def is_admin(self):
        return self.role=='admin'
        
    @property
    def is_manager(self):
        return self.role=='manager'

    @property
    def is_support(self):
        return self.role=='support'

        
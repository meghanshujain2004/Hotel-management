from rest_framework import serializers
from .models import CustomUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model=CustomUser
        fields=['id','username','email','phone','role','gender','profile_picture','is_active','date_joined']
        read_only_fields=['date_joined']

class RegisterUserSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True,required=True)
    
    class Meta:
        model=CustomUser
        fields=['username','email','password','role','phone','gender']

    def create(self,validated_data):
        user=CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            phone=validated_data['phone'],
            gender=validated_data.get('gender', 'male')
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls,user):
        token=super().get_token(user)
        token['role']=user.role
        return token

    def validate(self,attrs):
        data=super().validate(attrs)
        data['role']=self.user.role
        data['user_id']=self.user.id
        return data



class ChangePasswordSerializer(serializers.Serializer):
    old_password=serializers.CharField(required=True)
    new_password=serializers.CharField(required=True,min_length=6,max_length=100)

    def validate(self,attrs):
        old_password=attrs.get('old_password')
        new_password=attrs.get('new_password')
        user=self.context['request'].user
        if not user.check_password(old_password):
            raise serializers.ValidationError("Invalid old password")
        if old_password == new_password:
            raise serializers.ValidationError("New password must be different from old password")
        return attrs

    def save(self):
        user=self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
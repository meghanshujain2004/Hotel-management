from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser
from .serializers import (
    UserSerializer,
    RegisterUserSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer
)
from .permissions import IsAdminRole, IsManagerRole


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint: Returns JWT access & refresh tokens + user profile data.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """
    User Registration endpoint.
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterUserSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or Update currently logged-in user profile (/api/users/me/).
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """
    Change password for the logged-in user.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


from rest_framework import filters

class StaffViewSet(viewsets.ModelViewSet):
    """
    Staff Management for Admin & Manager:
    - Admin can list, create, and delete Managers & Support staff.
    - Manager can list, create, and delete Support staff only.
    """
    serializer_class = UserSerializer
    permission_classes = [IsManagerRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'phone']
    ordering_fields = ['date_joined', 'username']

    def get_queryset(self):
        queryset = CustomUser.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')
        if role:
            queryset = queryset.filter(role=role)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

    def create(self, request, *args, **kwargs):
        user = request.user
        role = request.data.get('role', 'support')
        username = request.data.get('username')
        email = request.data.get('email', '')
        phone = request.data.get('phone', '')
        password = request.data.get('password')

        if not username or not password:
            return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Managers can only create Support staff
        if user.role == 'manager' and role != 'support':
            return Response({'detail': 'Managers can only add Customer Support staff.'}, status=status.HTTP_403_FORBIDDEN)

        if CustomUser.objects.filter(username=username).exists():
            return Response({'detail': 'A user with this username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        if phone and CustomUser.objects.filter(phone=phone).exists():
            return Response({'detail': 'A user with this phone number already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        new_user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            phone=phone if phone else None
        )
        serializer = UserSerializer(new_user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        target_user = self.get_object()
        user = request.user

        # Managers can only remove Support staff
        if user.role == 'manager' and target_user.role != 'support':
            return Response({'detail': 'Managers can only remove Customer Support staff.'}, status=status.HTTP_403_FORBIDDEN)

        # Cannot remove superuser or oneself
        if target_user.id == user.id:
            return Response({'detail': 'You cannot remove your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        target_user.delete()
        return Response({'message': 'Staff member removed successfully.'}, status=status.HTTP_200_OK)



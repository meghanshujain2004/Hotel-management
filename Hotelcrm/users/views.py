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
from .permissions import IsAdminRole


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
    Staff Management for Admin (Screen 6):
    List, Retrieve, Update, and Delete staff members.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
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


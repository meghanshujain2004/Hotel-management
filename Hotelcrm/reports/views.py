from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsManagerRole, IsAdminRole
from .services import ExecutiveDashboardService, TeamPerformanceService, ReportExportService
from .serializers import (
    DashboardOverviewResponseSerializer,
    TeamPerformanceResponseSerializer,
    SupportAgentStatsSerializer,
    ManagerStatsSerializer
)

User = get_user_model()


class DashboardOverviewView(APIView):
    """
    Executive Main Dashboard (Screen 2 & Screen 7):
    Returns 3 large KPI metrics, sources donut chart breakdown, funnel, and recent activities.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        period = request.query_params.get('period', 'all')
        metrics_data = ExecutiveDashboardService.get_dashboard_metrics(period=period)
        serializer = DashboardOverviewResponseSerializer(metrics_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TeamPerformanceView(APIView):
    """
    Team & Performance Tab (Screen 10):
    Role-separated performance leaderboards for Managers vs Customer Support staff.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        data = TeamPerformanceService.get_team_leaderboard()
        serializer = TeamPerformanceResponseSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffIndividualStatsView(APIView):
    """
    Individual Staff Performance Card & Deep Dive (Screen 10 detail):
    Returns individual statistics for a specific staff member.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        target_user = get_object_or_404(User, pk=pk)

        # Non-managers can only view their own stats
        if request.user.role == 'support' and request.user.id != target_user.id:
            return Response(
                {'detail': 'You do not have permission to view other staff performance.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if target_user.role == 'manager':
            stats = TeamPerformanceService.get_manager_stats(target_user)
            serializer = ManagerStatsSerializer(stats)
        else:
            stats = TeamPerformanceService.get_support_agent_stats(target_user)
            serializer = SupportAgentStatsSerializer(stats)

        return Response(serializer.data, status=status.HTTP_200_OK)


class ReportExportCSVView(APIView):
    """
    Export Staff & Performance Statistics (Screen 10 Export action):
    Downloads performance report in CSV format.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        report_type = request.query_params.get('type', 'all')
        csv_content = ReportExportService.generate_csv_report(report_type=report_type)

        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="hotelcrm_performance_report_{report_type}.csv"'
        return response

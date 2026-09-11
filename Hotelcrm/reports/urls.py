from django.urls import path
from .views import (
    DashboardOverviewView,
    TeamPerformanceView,
    StaffIndividualStatsView,
    ReportExportCSVView
)

urlpatterns = [
    # Executive Main Dashboard KPIs & Funnel (Screen 2 & Screen 7)
    path('dashboard-overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),

    # Team & Performance Leaderboards (Screen 10)
    path('team-performance/', TeamPerformanceView.as_view(), name='team-performance'),
    path('staff/<int:pk>/stats/', StaffIndividualStatsView.as_view(), name='staff-stats'),

    # CSV Report Export
    path('export/', ReportExportCSVView.as_view(), name='report-export-csv'),
]

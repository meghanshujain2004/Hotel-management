from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

def api_root_view(request):
    return JsonResponse({
        'name': 'HotelCRM API',
        'status': 'running',
        'version': '1.0.0',
        'docs': {
            'swagger': '/api/docs/',
            'redoc': '/api/redoc/',
            'schema': '/api/schema/',
        },
        'endpoints': {
            'admin': '/admin/',
            'users': {
                'login': '/api/users/login/',
                'register': '/api/users/register/',
                'profile': '/api/users/me/',
                'staff': '/api/users/staff/',
                'token_refresh': '/api/users/token/refresh/',
            },
            'leads': {
                'directory': '/api/leads/',
                'upload_excel': '/api/leads/upload-excel/',
                'queue_active': '/api/leads/queue/active/',
                'queue_disposition': '/api/leads/queue/disposition/',
                'escalations': '/api/leads/escalations/',
                'check_escalations': '/api/leads/check-escalations/',
                'templates': '/api/leads/templates/',
            },
            'reports': {
                'dashboard_overview': '/api/reports/dashboard-overview/',
                'team_performance': '/api/reports/team-performance/',
                'staff_stats': '/api/reports/staff/{id}/stats/',
                'export_csv': '/api/reports/export/',
            }
        }
    })

urlpatterns = [
    path('', api_root_view, name='api_root'),
    
    # OpenAPI 3.0 / Swagger & Redoc Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Applications
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/leads/', include('leads.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)



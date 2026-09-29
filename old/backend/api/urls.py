from django.urls import path, re_path
from . import views, matrix_views, matrix_proxy

app_name = 'api'

urlpatterns = [
    path('advertisements', views.advertisements_api, name='advertisements'),
    path('news-ticker', views.news_ticker_api, name='news_ticker'),
    path('packages', views.packages_api, name='packages'),
    path('agents', views.agents_api, name='agents'),
    path('settings', views.settings_api, name='settings'),
    path('links', views.links_api, name='links'),
    path('live-channels', views.live_channels_api, name='live_channels'),
    path('teams', views.teams_api, name='teams'),
    path('matches', views.matches_api, name='matches'),
    path('matches/<int:match_id>/vote', views.match_vote_api, name='match_vote'),
    path('chat-status', views.chat_status_api, name='chat_status'),
    path('status-buttons', views.status_buttons_api, name='status_buttons'),
    # Matrix API endpoints
    path('matrix/register', matrix_views.matrix_register, name='matrix_register'),
    path('matrix/login', matrix_views.matrix_login, name='matrix_login'),
    path('matrix/config', matrix_views.matrix_config, name='matrix_config'),
    path('matrix/test-connection', matrix_views.matrix_test_connection, name='matrix_test_connection'),
    path('matrix/rooms/<int:channel_id>/create', matrix_views.create_channel_room, name='create_channel_room'),
    path('matrix/rooms/<int:channel_id>/info', matrix_views.get_channel_room_info, name='get_channel_room_info'),
    # Matrix Proxy - يجب أن يكون في النهاية لأنه يلتقط كل المسارات
    re_path(r'^matrix-proxy/(?P<path>.*)$', matrix_proxy.matrix_proxy, name='matrix_proxy'),
]


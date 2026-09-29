from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Advertisement, NewsTicker, Package, Agent, SiteSettings, Link, LiveChannel, Team, Match, StatusButton
import os


@require_http_methods(["GET"])
def advertisements_api(request):
    """API endpoint للإعلانات"""
    try:
        advertisements = Advertisement.objects.filter(is_active=True).order_by('order', 'created_at')
        
        data = []
        for ad in advertisements:
            # بناء رابط الصورة الكامل
            if ad.image and hasattr(ad.image, 'url'):
                image_url = request.build_absolute_uri(ad.image.url)
            else:
                image_url = ""
            
            data.append({
                "url": image_url,
                "name": ad.name or "",
                "link": ad.link or ""
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def news_ticker_api(request):
    """API endpoint للشريط المتحرك"""
    try:
        news_items = NewsTicker.objects.filter(is_active=True).order_by('order', 'created_at')
        
        if not news_items.exists():
            return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})
        
        # إرجاع مصفوفة من النصوص (الشكل 2 في الوثائق)
        texts = [item.text for item in news_items]
        
        return JsonResponse(texts, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def packages_api(request):
    """API endpoint للباقات"""
    try:
        packages = Package.objects.filter(is_active=True).order_by('order', 'created_at')
        
        data = []
        for package in packages:
            data.append({
                "id": package.id,
                "name": package.name,
                "price": float(package.price),
                "time": package.time,
                "download": package.download,
                "validity": package.validity,
                "order": package.order
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def agents_api(request):
    """API endpoint للوكلاء"""
    try:
        agents = Agent.objects.filter(is_active=True).order_by('order', 'created_at')
        
        data = []
        for agent in agents:
            data.append({
                "id": agent.id,
                "name": agent.name,
                "address": agent.address,
                "phone": agent.phone,
                "order": agent.order
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def settings_api(request):
    """API endpoint لإعدادات الموقع"""
    try:
        settings_obj = SiteSettings.load()
        
        # بناء رابط الشعار الكامل
        logo_url = None
        if settings_obj.logo and hasattr(settings_obj.logo, 'url'):
            logo_url = request.build_absolute_uri(settings_obj.logo.url)
        
        data = {
            "network_name": settings_obj.network_name or "شبكة MATCH LINK",
            "logo": logo_url,
            "admin_phone": settings_obj.admin_phone or "",
            "repair_phone": settings_obj.repair_phone or "",
            "enable_customer_login": settings_obj.enable_customer_login,
            "enable_chat": settings_obj.enable_chat
        }
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        # إرجاع قيم افتراضية في حالة الخطأ
        return JsonResponse({
            "network_name": "شبكة MATCH LINK",
            "logo": None,
            "admin_phone": "",
            "repair_phone": "",
            "enable_customer_login": False,
            "enable_chat": False
        }, safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def links_api(request):
    """API endpoint للروابط السريعة"""
    try:
        links = Link.objects.filter(is_active=True).order_by('order', 'created_at')
        
        data = []
        for link in links:
            # بناء رابط الأيقونة الكامل
            icon_url = None
            if link.icon and hasattr(link.icon, 'url'):
                icon_url = request.build_absolute_uri(link.icon.url)
            
            data.append({
                "id": link.id,
                "name": link.name,
                "url": link.url,
                "icon": icon_url,
                "order": link.order
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def live_channels_api(request):
    """API endpoint لقنوات البث المباشر"""
    try:
        channels = LiveChannel.objects.filter(is_active=True).order_by('order', 'created_at')
        
        data = []
        for channel in channels:
            # بناء رابط الأيقونة الكامل
            icon_url = None
            if channel.icon and hasattr(channel.icon, 'url'):
                icon_url = request.build_absolute_uri(channel.icon.url)
            
            data.append({
                "id": channel.id,
                "name": channel.name,
                "url": channel.stream_url,
                "type": channel.stream_type,
                "icon": icon_url,
                "description": channel.description or "",
                "order": channel.order
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def chat_status_api(request):
    """API endpoint للتحقق من حالة خدمة الدردشة"""
    try:
        settings_obj = SiteSettings.load()
        data = {
            "enabled": settings_obj.enable_chat
        }
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({"enabled": False}, safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def teams_api(request):
    """API endpoint للفرق الرياضية"""
    try:
        # جلب الفرق النشطة فقط
        teams = Team.objects.filter(is_active=True).order_by('team_type', 'name')
        
        data = []
        for team in teams:
            # بناء رابط الشعار الكامل
            logo_url = None
            if team.logo and hasattr(team.logo, 'url'):
                logo_url = request.build_absolute_uri(team.logo.url)
            
            data.append({
                "id": team.id,
                "name": team.name,
                "teamType": team.team_type,
                "teamTypeDisplay": team.get_team_type_display(),
                "logo": logo_url or ""
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def matches_api(request):
    """API endpoint للمواجهات الرياضية"""
    try:
        # جلب المباريات النشطة فقط مع الفرق المرتبطة
        matches = Match.objects.filter(is_active=True).select_related('team1', 'team2', 'live_channel').order_by('match_time', 'order')
        
        data = []
        for match in matches:
            # بناء روابط الشعارات الكاملة
            team1_logo_url = None
            if match.team1 and match.team1.logo and hasattr(match.team1.logo, 'url'):
                team1_logo_url = request.build_absolute_uri(match.team1.logo.url)
            
            team2_logo_url = None
            if match.team2 and match.team2.logo and hasattr(match.team2.logo, 'url'):
                team2_logo_url = request.build_absolute_uri(match.team2.logo.url)
            
            # تنسيق وقت المباراة بالتوقيت المحلي
            if match.match_time:
                # تحويل الوقت إلى التوقيت المحلي (Asia/Riyadh)
                local_time = timezone.localtime(match.match_time)
                # إرسال الوقت بصيغة ISO 8601 ليتعرف عليه JavaScript بشكل صحيح
                match_time_str = local_time.isoformat()
            else:
                match_time_str = ""
            
            # الحصول على حالة المباراة
            status = match.match_status
            
            # الحصول على إحصائيات التصويت
            vote_stats = match.vote_stats
            
            data.append({
                "id": match.id,
                "matchType": match.match_type,
                "matchTypeDisplay": match.get_match_type_display(),
                "team1Name": match.team1.name if match.team1 else "",
                "team1Logo": team1_logo_url or "",
                "team1Type": match.team1.team_type if match.team1 else "",
                "team2Name": match.team2.name if match.team2 else "",
                "team2Logo": team2_logo_url or "",
                "team2Type": match.team2.team_type if match.team2 else "",
                "matchTime": match_time_str,
                "channel": match.channel_name,
                "liveChannelId": match.live_channel.id if match.live_channel else None,
                "status": status['status'],
                "statusDisplay": status['display'],
                "statusClass": status['class'],
                "order": match.order,
                # بيانات التصويت
                "totalVotes": vote_stats['total_votes'],
                "team1Votes": vote_stats['team1_votes'],
                "team2Votes": vote_stats['team2_votes'],
                "team1Percentage": vote_stats['team1_percentage'],
                "team2Percentage": vote_stats['team2_percentage']
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        import traceback
        print(f"Error in matches_api: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


@csrf_exempt
@require_http_methods(["POST"])
def match_vote_api(request, match_id):
    """API endpoint للتصويت على الفريق الفائز في المباراة"""
    try:
        import json
        from django.db.models import F
        
        # الحصول على المباراة
        try:
            match = Match.objects.get(id=match_id, is_active=True)
        except Match.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'المباراة غير موجودة'
            }, status=404, json_dumps_params={'ensure_ascii': False})
        
        # قراءة بيانات الطلب
        try:
            data = json.loads(request.body)
            team_choice = data.get('team')
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'بيانات غير صحيحة'
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        # التحقق من صحة الاختيار
        if team_choice not in ['team1', 'team2']:
            return JsonResponse({
                'success': False,
                'error': 'اختيار غير صحيح'
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        # زيادة عداد التصويت للفريق المختار
        if team_choice == 'team1':
            Match.objects.filter(id=match_id).update(team1_votes=F('team1_votes') + 1)
        else:
            Match.objects.filter(id=match_id).update(team2_votes=F('team2_votes') + 1)
        
        # إعادة جلب المباراة لإرجاع البيانات المحدثة
        match.refresh_from_db()
        vote_stats = match.vote_stats
        
        return JsonResponse({
            'success': True,
            'message': 'تم التصويت بنجاح',
            'vote_stats': {
                'totalVotes': vote_stats['total_votes'],
                'team1Votes': vote_stats['team1_votes'],
                'team2Votes': vote_stats['team2_votes'],
                'team1Percentage': vote_stats['team1_percentage'],
                'team2Percentage': vote_stats['team2_percentage']
            }
        }, json_dumps_params={'ensure_ascii': False})
        
    except Exception as e:
        import traceback
        print(f"Error in match_vote_api: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ في التصويت'
        }, status=500, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def status_buttons_api(request):
    """API endpoint لأزرار صفحة الحالة"""
    try:
        buttons = StatusButton.objects.filter(is_active=True).order_by('order', 'created_at')
        
        data = []
        for button in buttons:
            data.append({
                "id": button.id,
                "name": button.name,
                "url": button.url,
                "icon": button.icon or "",
                "order": button.order
            })
        
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse([], safe=False, json_dumps_params={'ensure_ascii': False})


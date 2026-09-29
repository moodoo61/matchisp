@echo off
chcp 65001 > nul
echo ========================================
echo   إنشاء مستخدم مشرف
echo ========================================
echo.

cd /d "%~dp0"

REM تفعيل البيئة الافتراضية إن وجدت
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

echo سيتم إنشاء حساب مشرف للوحة التحكم
echo الرجاء إدخال المعلومات التالية:
echo.

python manage.py createsuperuser

echo.
echo ========================================
echo يمكنك الآن الدخول إلى لوحة التحكم من:
echo http://127.0.0.1:8000/admin
echo ========================================
echo.
pause



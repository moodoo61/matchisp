@echo off
chcp 65001 > nul
echo ========================================
echo   إعداد بيئة MATCH الخلفية
echo ========================================
echo.

cd /d "%~dp0"

REM التحقق من وجود Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Python غير مثبت على النظام
    echo الرجاء تثبيت Python من: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] إنشاء البيئة الافتراضية...
if exist "venv" (
    echo [!] البيئة الافتراضية موجودة بالفعل
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [خطأ] فشل إنشاء البيئة الافتراضية
        pause
        exit /b 1
    )
    echo [✓] تم إنشاء البيئة الافتراضية
)

echo.
echo [2/4] تفعيل البيئة الافتراضية...
call venv\Scripts\activate.bat

echo.
echo [3/4] تثبيت المتطلبات...
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [خطأ] فشل تثبيت المتطلبات
    pause
    exit /b 1
)

echo.
echo [4/4] إعداد قاعدة البيانات...
python manage.py makemigrations
python manage.py migrate

echo.
echo ========================================
echo   تم الإعداد بنجاح!
echo ========================================
echo.
echo لتشغيل السيرفر، استخدم:
echo   start_server.bat
echo.
echo لإنشاء مستخدم مشرف:
echo   python manage.py createsuperuser
echo.
pause



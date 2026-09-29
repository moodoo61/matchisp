@echo off
chcp 65001 > nul
echo ========================================
echo   تشغيل سيرفر MATCH الخلفي
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

echo [1/5] التحقق من البيئة الافتراضية...

REM التحقق من وجود البيئة الافتراضية
if exist "venv\Scripts\activate.bat" (
    echo [✓] تم العثور على البيئة الافتراضية
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    echo [✓] تم العثور على البيئة الافتراضية
    call .venv\Scripts\activate.bat
) else (
    echo [!] لم يتم العثور على بيئة افتراضية
    echo [!] سيتم استخدام Python العام للنظام
)

echo.
echo [2/5] التحقق من المتطلبات...

REM التحقق من تثبيت Django
python -c "import django" >nul 2>&1
if errorlevel 1 (
    echo [!] Django غير مثبت. جاري تثبيت المتطلبات...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [خطأ] فشل تثبيت المتطلبات
        pause
        exit /b 1
    )
) else (
    echo [✓] المتطلبات مثبتة بالفعل
)
echo.
echo [5/5] بدء تشغيل السيرفر...
echo.
echo ========================================
echo   السيرفر يعمل الآن على:
echo   http://127.0.0.1:8000
echo   http://localhost:8000
echo ========================================
echo.
echo للإيقاف: اضغط Ctrl+C
echo ========================================
echo.

python manage.py runserver 0.0.0.0:8000

pause



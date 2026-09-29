@echo off
chcp 65001 > nul
cd /d "%~dp0"

REM تفعيل البيئة الافتراضية إن وجدت
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

REM تشغيل السيرفر مباشرة
python manage.py runserver 0.0.0.0:8000



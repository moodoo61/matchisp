#!/usr/bin/env bash
# بناء APK لتجربة الاتصال ونسخه إلى var/comms/android/ للتحميل العام
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT}/apps/android-call-test"
OUT_DIR="${ROOT}/downloads"
SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-/opt/android-sdk}}"

export ANDROID_HOME="${SDK_ROOT}"
export ANDROID_SDK_ROOT="${SDK_ROOT}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export PATH="${JAVA_HOME}/bin:${SDK_ROOT}/cmdline-tools/latest/bin:${SDK_ROOT}/platform-tools:${PATH}"

if [[ ! -x "${JAVA_HOME}/bin/java" ]]; then
  echo "خطأ: Java 17 غير موجودة في ${JAVA_HOME}" >&2
  exit 1
fi
if [[ ! -d "${SDK_ROOT}/platforms/android-34" ]]; then
  echo "خطأ: Android SDK platforms;android-34 غير مثبت تحت ${SDK_ROOT}" >&2
  exit 1
fi

mkdir -p "${APP_DIR}" "${OUT_DIR}"
cat > "${APP_DIR}/local.properties" <<EOF
sdk.dir=${SDK_ROOT}
EOF

cd "${APP_DIR}"

if [[ ! -f gradlew ]]; then
  echo "تثبيت Gradle Wrapper…"
  if ! command -v gradle >/dev/null 2>&1; then
    TMP_GRADLE="/tmp/gradle-8.7"
    if [[ ! -x "${TMP_GRADLE}/bin/gradle" ]]; then
      wget -q https://services.gradle.org/distributions/gradle-8.7-bin.zip -O /tmp/gradle-8.7-bin.zip
      rm -rf "${TMP_GRADLE}"
      unzip -q -o /tmp/gradle-8.7-bin.zip -d /tmp
    fi
    "${TMP_GRADLE}/bin/gradle" wrapper --gradle-version 8.7
  else
    gradle wrapper --gradle-version 8.7
  fi
fi

chmod +x gradlew
./gradlew :app:assembleDebug --no-daemon

APK_SRC="${APP_DIR}/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "${APK_SRC}" ]]; then
  echo "خطأ: لم يُنشأ APK في ${APK_SRC}" >&2
  exit 1
fi

install -m 644 "${APK_SRC}" "${OUT_DIR}/match-call-test.apk"
echo "تم: ${OUT_DIR}/match-call-test.apk"
ls -lh "${OUT_DIR}/match-call-test.apk"

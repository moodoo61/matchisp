import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import {
  COMMS_ANDROID_APK_PUBLIC_PATH,
  COMMS_ANDROID_APK_RELATIVE,
} from '../constants/discovery-ports';

@Injectable()
export class CommsAndroidApkService {
  resolveApkPath(): string {
    const candidates = [
      process.env.COMMS_ANDROID_APK_PATH?.trim(),
      join(process.cwd(), COMMS_ANDROID_APK_RELATIVE),
      // عند تشغيل Nest من apps/api
      join(process.cwd(), '..', '..', COMMS_ANDROID_APK_RELATIVE),
      join(process.cwd(), '..', COMMS_ANDROID_APK_RELATIVE),
    ].filter((p): p is string => Boolean(p));

    for (const path of candidates) {
      if (existsSync(path) && isNonEmptyFile(path)) return path;
    }
    // المسار الافتراضي المتوقع حتى لو الملف غير موجود بعد
    return join(process.cwd(), '..', '..', COMMS_ANDROID_APK_RELATIVE);
  }

  isAvailable(): boolean {
    const path = this.resolveApkPath();
    return isNonEmptyFile(path);
  }

  publicDownloadPath(): string {
    return COMMS_ANDROID_APK_PUBLIC_PATH;
  }

  fileName(): string {
    return 'match-call-test.apk';
  }
}

function isNonEmptyFile(path: string): boolean {
  try {
    if (!existsSync(path)) return false;
    const st = statSync(path);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

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
    return join(process.cwd(), COMMS_ANDROID_APK_RELATIVE);
  }

  isAvailable(): boolean {
    const path = this.resolveApkPath();
    if (!existsSync(path)) return false;
    try {
      return statSync(path).isFile() && statSync(path).size > 0;
    } catch {
      return false;
    }
  }

  publicDownloadPath(): string {
    return COMMS_ANDROID_APK_PUBLIC_PATH;
  }

  fileName(): string {
    return 'match-call-test.apk';
  }
}

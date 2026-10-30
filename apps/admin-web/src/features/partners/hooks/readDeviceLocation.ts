export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
};

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'تم رفض إذن الموقع — فعّله من إعدادات المتصفح/الهاتف';
    case err.POSITION_UNAVAILABLE:
      return 'تعذر تحديد الموقع حالياً';
    case err.TIMEOUT:
      return 'انتهت مهلة تحديد الموقع — حاول مجدداً';
    default:
      return 'تعذر قراءة موقع الجهاز';
  }
}

function getPosition(
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function toDeviceLocation(pos: GeolocationPosition): DeviceLocation {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracyMeters:
      typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
  };
}

/** يقرأ إحداثيات الجهاز عبر Geolocation API مع محاولات احتياطية */
export async function readDeviceLocation(): Promise<DeviceLocation> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('المتصفح لا يدعم تحديد الموقع');
  }

  if (!window.isSecureContext) {
    throw new Error(
      'تحديد الموقع يتطلب اتصالاً آمناً (HTTPS أو localhost) — استخدم الإدخال اليدوي أو الخريطة',
    );
  }

  if (!navigator.geolocation) {
    throw new Error('المتصفح لا يدعم تحديد الموقع');
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60_000 },
  ];

  let lastError: Error | null = null;

  for (const options of attempts) {
    try {
      const pos = await getPosition(options);
      return toDeviceLocation(pos);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        const geoErr = err as GeolocationPositionError;
        lastError = new Error(geolocationErrorMessage(geoErr));
        // رفض الإذن نهائي — لا فائدة من إعادة المحاولة
        if (geoErr.code === geoErr.PERMISSION_DENIED) break;
      } else {
        lastError =
          err instanceof Error ? err : new Error('تعذر قراءة موقع الجهاز');
      }
    }
  }

  throw lastError ?? new Error('تعذر قراءة موقع الجهاز');
}

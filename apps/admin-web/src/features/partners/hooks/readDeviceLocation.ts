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

/** يقرأ إحداثيات الجهاز عبر Geolocation API (يعمل على الهاتف عند السماح) */
export function readDeviceLocation(): Promise<DeviceLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('المتصفح لا يدعم تحديد الموقع'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters:
            typeof pos.coords.accuracy === 'number'
              ? pos.coords.accuracy
              : null,
        });
      },
      (err) => reject(new Error(geolocationErrorMessage(err))),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  });
}

type GoogleMapsNs = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: {
        center: { lat: number; lng: number };
        zoom: number;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      },
    ) => GoogleMap;
    Marker: new (opts: {
      position: { lat: number; lng: number };
      map: GoogleMap;
      draggable?: boolean;
    }) => GoogleMarker;
    event: {
      addListener: (
        instance: unknown,
        eventName: string,
        handler: (...args: unknown[]) => void,
      ) => { remove: () => void };
    };
  };
};

type GoogleMap = {
  setCenter: (pos: { lat: number; lng: number }) => void;
  addListener: (
    eventName: string,
    handler: (e: { latLng: { lat: () => number; lng: () => number } | null }) => void,
  ) => void;
};

type GoogleMarker = {
  setPosition: (pos: { lat: number; lng: number }) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null;
  addListener: (eventName: string, handler: () => void) => void;
};

declare global {
  interface Window {
    google?: GoogleMapsNs;
    __partnersGoogleMapsReady?: () => void;
  }
}

const SCRIPT_ID = 'partners-google-maps-js';
const loaders = new Map<string, Promise<GoogleMapsNs>>();

export type GoogleMapsApi = GoogleMapsNs;

export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsNs> {
  const key = apiKey.trim();
  if (!key) return Promise.reject(new Error('مفتاح خرائط Google غير مضبوط'));

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('الخريطة متاحة في المتصفح فقط'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  const cached = loaders.get(key);
  if (cached) return cached;

  const promise = new Promise<GoogleMapsNs>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const wait = () => {
        if (window.google?.maps) resolve(window.google);
        else reject(new Error('تعذر تحميل خرائط Google'));
      };
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }
      existing.addEventListener('load', wait, { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('تعذر تحميل خرائط Google')),
        { once: true },
      );
      return;
    }

    window.__partnersGoogleMapsReady = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error('تعذر تهيئة خرائط Google'));
    };

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__partnersGoogleMapsReady&language=ar`;
    script.onerror = () =>
      reject(new Error('تعذر تحميل خرائط Google — تحقق من المفتاح'));
    document.head.appendChild(script);
  });

  loaders.set(key, promise);
  return promise;
}

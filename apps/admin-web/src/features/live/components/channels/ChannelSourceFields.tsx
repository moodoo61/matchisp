'use client';

import type { ChannelType, HdmiCaptureDevice } from '@/features/live/types';

type Props = {
  type: ChannelType;
  sourceUrl: string;
  devices: HdmiCaptureDevice[];
  devicesLoading: boolean;
  selectedDeviceId: string;
  videoDevice: string;
  audioDevice: string;
  onSourceUrlChange: (value: string) => void;
  onSelectDevice: (deviceId: string) => void;
  onKeepSavedDevice: () => void;
  onRediscover: () => void;
  onAudioDeviceChange: (value: string) => void;
};

export function ChannelSourceFields({
  type,
  sourceUrl,
  devices,
  devicesLoading,
  selectedDeviceId,
  videoDevice,
  audioDevice,
  onSourceUrlChange,
  onSelectDevice,
  onKeepSavedDevice,
  onRediscover,
  onAudioDeviceChange,
}: Props) {
  if (type === 'IPTV') {
    return (
      <label>
        المصدر
        <input
          value={sourceUrl}
          onChange={(e) => onSourceUrlChange(e.target.value)}
          placeholder="رابط أو مسار التدفق"
          required
        />
      </label>
    );
  }

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const audioOptions = selectedDevice?.audioPaths?.length
    ? selectedDevice.audioPaths
    : audioDevice
      ? [audioDevice]
      : [];

  return (
    <>
      <div className="field-row">
        <label className="field-grow">
          المصدر
          <select
            value={selectedDeviceId}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '__saved__') {
                onKeepSavedDevice();
                return;
              }
              onSelectDevice(value);
            }}
            required
            disabled={devicesLoading}
          >
            <option value="">
              {devicesLoading
                ? 'جاري استكشاف الأجهزة…'
                : devices.length
                  ? 'اختر جهاز HDMI Capture'
                  : 'لا أجهزة متاحة (الكل مستخدم أو غير متصل)'}
            </option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
                {device.videoPath ? ` — ${device.videoPath}` : ''}
              </option>
            ))}
            {!devicesLoading &&
            videoDevice &&
            !devices.some((d) => d.videoPath === videoDevice) ? (
              <option value="__saved__">
                الجهاز المحفوظ — {videoDevice}
              </option>
            ) : null}
          </select>
        </label>
        <button
          className="btn secondary"
          type="button"
          title="إعادة الاستكشاف"
          onClick={onRediscover}
          disabled={devicesLoading}
        >
          ↻
        </button>
      </div>

      {selectedDeviceId === '__saved__' ? (
        <p className="muted">
          الجهاز المحفوظ غير متصل حالياً. أعد توصيله أو اختر جهازاً آخر.
        </p>
      ) : null}

      {selectedDevice && audioOptions.length > 1 ? (
        <label>
          مسار الصوت
          <select
            value={audioDevice}
            onChange={(e) => onAudioDeviceChange(e.target.value)}
            required
          >
            {audioOptions.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        </label>
      ) : selectedDevice ? (
        <p className="muted" dir="ltr">
          فيديو: {selectedDevice.videoPath}
          {audioDevice ? ` · صوت: ${audioDevice}` : ''}
        </p>
      ) : null}
    </>
  );
}

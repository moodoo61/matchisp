'use client';

import { uploadChannelImage } from '@/features/live/api';
import { ImageUploadField, Modal } from '@/shared/ui';
import { ChannelSectionPicker } from './ChannelSectionPicker';
import { ChannelSourceFields } from './ChannelSourceFields';
import { ChannelGpuQualityField } from './ChannelGpuQualityField';
import { ChannelSourceModeField } from '../encoding/source-options/ChannelSourceModeField';
import { HlsVariantPicker } from '../encoding/source-options/HlsVariantPicker';
import {
  useChannelModal,
  type ChannelModalState,
} from '../../hooks/useChannelModal';
import type { ChannelType } from '@/features/live/types';

type Props = {
  state: ChannelModalState;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function ChannelModal({ state, onClose, onSaved }: Props) {
  const form = useChannelModal(state, onClose, onSaved);

  return (
    <Modal
      open={!!state}
      title={state === 'new' ? 'إضافة قناة' : 'تعديل قناة'}
      onClose={onClose}
      footer={
        <div className="modal-footer-row">
          {form.sectionId && !form.addingSection ? (
            <label className="check-row modal-footer-option">
              <input
                type="checkbox"
                checked={form.alwaysOn}
                onChange={(e) => form.setAlwaysOn(e.target.checked)}
                form="live-channel-form"
              />
              تشغيل دائم
            </label>
          ) : (
            <span />
          )}
          <div className="modal-footer-actions">
            <button className="btn secondary" type="button" onClick={onClose}>
              إلغاء
            </button>
            <button
              className="btn"
              type="submit"
              form="live-channel-form"
              disabled={form.busy || form.addingSection}
            >
              حفظ
            </button>
          </div>
        </div>
      }
    >
      <form id="live-channel-form" className="form" onSubmit={form.submit}>
        {form.error ? <p className="error">{form.error}</p> : null}

        <ChannelSectionPicker
          sections={form.sections}
          sectionId={form.sectionId}
          addingSection={form.addingSection}
          newSectionLabel={form.newSectionLabel}
          newSectionName={form.newSectionName}
          sectionBusy={form.sectionBusy}
          onSectionIdChange={form.setSectionId}
          onStartAdd={() => {
            form.setAddingSection(true);
            form.setNewSectionLabel('');
            form.setNewSectionName('');
          }}
          onCancelAdd={() => {
            form.setAddingSection(false);
            form.setNewSectionLabel('');
            form.setNewSectionName('');
          }}
          onNewSectionLabelChange={form.setNewSectionLabel}
          onNewSectionNameChange={form.setNewSectionName}
          onSaveSection={form.saveSection}
        />

        {form.sectionId && !form.addingSection ? (
          <>
            <div className="channel-media-row">
              <div className="channel-sort-field">
                <span className="field-caption">الترتيب</span>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => form.setSortOrder(Number(e.target.value))}
                />
              </div>
              <div className="channel-image-field">
                <span className="field-caption">الصورة</span>
                <ImageUploadField
                  value={form.imageUrl}
                  onChange={form.setImageUrl}
                  required={false}
                  onUpload={async (file) => {
                    const res = await uploadChannelImage(file);
                    return res.imageUrl;
                  }}
                />
              </div>
            </div>

            <label>
              الاسم (للعرض)
              <input
                value={form.label}
                onChange={(e) => form.setLabel(e.target.value)}
                placeholder="مثال: بي إن 1"
                required
              />
            </label>

            <label>
              name
              <input
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
                placeholder="مثال: bein_1"
                dir="ltr"
                required
                pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*"
                title="إنجليزي فقط (a-z, 0-9, _, -)"
              />
            </label>

            <label>
              النوع
              <select
                value={form.type}
                onChange={(e) =>
                  form.changeType(e.target.value as ChannelType)
                }
              >
                <option value="IPTV">IPTV</option>
                <option value="HDMI">HDMI</option>
              </select>
            </label>

            <ChannelSourceFields
              type={form.type}
              sourceUrl={form.sourceUrl}
              devices={form.devices}
              devicesLoading={form.devicesLoading}
              selectedDeviceId={form.selectedDeviceId}
              videoDevice={form.videoDevice}
              audioDevice={form.audioDevice}
              onSourceUrlChange={form.setSourceUrl}
              onSelectDevice={(id) => form.selectHdmiDevice(id)}
              onKeepSavedDevice={() => form.setSelectedDeviceId('__saved__')}
              onRediscover={() => void form.discoverHdmiDevices()}
              onAudioDeviceChange={form.setAudioDevice}
            />

            <ChannelSourceModeField
              options={form.sourceOptions}
              value={form.sourceMode}
              disabled={form.busy}
              onChange={form.changeSourceMode}
            />

            {form.showHlsVariantPicker ? (
              <HlsVariantPicker
                variants={form.hlsVariants}
                selectedUrls={form.selectedVariantUrls}
                busy={form.hlsProbeBusy}
                error={form.hlsProbeError}
                onAnalyze={() => void form.analyzeHlsSource()}
                onChangeSelected={form.setSelectedVariantUrls}
              />
            ) : null}

            {form.sourceMode === 'encode_gpu' ? (
              <ChannelGpuQualityField
                options={form.qualityOptions}
                selectedIds={form.qualityRungIds}
                disabled={form.busy}
                onChange={form.setQualityRungIds}
              />
            ) : null}
          </>
        ) : null}
      </form>
    </Modal>
  );
}

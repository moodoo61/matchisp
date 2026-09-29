'use client';

import type { ChannelSection } from '@/features/live/types';

type Props = {
  sections: ChannelSection[];
  sectionId: string;
  addingSection: boolean;
  newSectionLabel: string;
  newSectionName: string;
  sectionBusy: boolean;
  onSectionIdChange: (id: string) => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onNewSectionLabelChange: (value: string) => void;
  onNewSectionNameChange: (value: string) => void;
  onSaveSection: () => void;
};

export function ChannelSectionPicker({
  sections,
  sectionId,
  addingSection,
  newSectionLabel,
  newSectionName,
  sectionBusy,
  onSectionIdChange,
  onStartAdd,
  onCancelAdd,
  onNewSectionLabelChange,
  onNewSectionNameChange,
  onSaveSection,
}: Props) {
  if (addingSection) {
    return (
      <div className="section-create-block">
        <label>
          اسم القسم (للعرض)
          <input
            value={newSectionLabel}
            onChange={(e) => onNewSectionLabelChange(e.target.value)}
            placeholder="مثال: رياضة"
            autoFocus
            required
          />
        </label>
        <label>
          name
          <input
            value={newSectionName}
            onChange={(e) => onNewSectionNameChange(e.target.value)}
            placeholder="مثال: sports"
            dir="ltr"
            required
            pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*"
            title="إنجليزي فقط (a-z, 0-9, _, -)"
          />
        </label>
        <div className="field-row">
          <button className="btn secondary" type="button" onClick={onCancelAdd}>
            إلغاء
          </button>
          <button
            className="btn"
            type="button"
            onClick={onSaveSection}
            disabled={
              sectionBusy || !newSectionLabel.trim() || !newSectionName.trim()
            }
          >
            حفظ القسم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="field-row">
      <label className="field-grow">
        القسم
        <select
          value={sectionId}
          onChange={(e) => onSectionIdChange(e.target.value)}
          required
        >
          <option value="">اختر القسم</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} ({s.name})
            </option>
          ))}
        </select>
      </label>
      <button
        className="btn secondary"
        type="button"
        title="إضافة قسم"
        onClick={onStartAdd}
      >
        +
      </button>
    </div>
  );
}

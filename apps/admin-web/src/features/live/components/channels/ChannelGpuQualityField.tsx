'use client';

type QualityOption = {
  id: string;
  label: string;
};

type Props = {
  options: QualityOption[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
};

/** جودات ABR للقناة عند اختيار ترميز GPU — تفعيل/إلغاء فقط */
export function ChannelGpuQualityField({
  options,
  selectedIds,
  disabled,
  onChange,
}: Props) {
  if (!options.length) return null;

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return;
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="channel-gpu-quality">
      <span className="field-caption">الجودات</span>
      <div className="channel-gpu-quality-list" role="group" aria-label="الجودات">
        {options.map((option) => {
          const checked = selectedIds.includes(option.id);
          return (
            <label
              key={option.id}
              className={
                checked
                  ? 'channel-gpu-quality-item is-on'
                  : 'channel-gpu-quality-item'
              }
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled || (checked && selectedIds.length <= 1)}
                onChange={() => toggle(option.id)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

'use client';

export type FormPanelTab = {
  id: string;
  label: string;
};

type Props = {
  tabs: FormPanelTab[];
  active: string;
  onChange: (id: string) => void;
};

/** تبويبات داخل نموذج (تفاصيل / مرفقات…) */
export function FormPanelTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="form-panel-tabs" role="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`form-panel-tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPublicMorePage } from '../api';
import type { PublicMorePage } from '../types';
import { AboutIcon } from './AboutIcon';
import '../styles/more-public.css';

type TabKey = 'items' | 'about' | 'story';

const TAB_LABELS: Record<TabKey, string> = {
  items: 'الخدمات',
  about: 'من نحن',
  story: 'قصة ماتش لينك',
};

function paragraphs(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** واجهة صفحة المزيد العامة — مطابقة لشكل النموذج الأصلي */
export function MorePublicView() {
  const [data, setData] = useState<PublicMorePage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('items');
  const [openInstructions, setOpenInstructions] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await getPublicMorePage();
        if (cancelled) return;
        setData(payload);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'تعذر التحميل');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableTabs = useMemo(() => {
    if (!data?.enabled) return [] as TabKey[];
    const tabs: TabKey[] = [];
    if (data.tabs.items.enabled) tabs.push('items');
    if (data.tabs.about.enabled) tabs.push('about');
    if (data.tabs.story.enabled) tabs.push('story');
    return tabs;
  }, [data]);

  useEffect(() => {
    if (!availableTabs.length) return;
    if (!availableTabs.includes(tab)) {
      setTab(availableTabs[0]);
    }
  }, [availableTabs, tab]);

  if (error) {
    return (
      <div className="mp-app">
        <div className="mp-state">
          <h1>تعذر فتح الصفحة</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mp-app">
        <div className="mp-state">
          <p>جاري التحميل…</p>
        </div>
      </div>
    );
  }

  if (!data.enabled) {
    return (
      <div className="mp-app">
        <div className="mp-state">
          <h1>الصفحة غير متاحة حالياً</h1>
          <p>يُرجى المحاولة لاحقاً.</p>
        </div>
      </div>
    );
  }

  const active = data.tabs[tab];

  return (
    <div className="mp-app">
      <div className="mp-main-wrapper">
        <aside className="mp-visual" aria-hidden={false}>
          <div className="mp-visual-overlay" />
          <div className="mp-visual-content">
            <div className="mp-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/more/logo.png" alt="Logo" />
            </div>
            <h1 className="mp-visual-title">{data.hero.title}</h1>
            <p className="mp-visual-subtitle">{data.hero.subtitle}</p>
          </div>
          <div className="mp-animated-bg">
            <div className="mp-wave mp-wave-1" />
            <div className="mp-wave mp-wave-2" />
            <div className="mp-wave mp-wave-3" />
          </div>
        </aside>

        <section className="mp-content-section">
          <div className="mp-container">
            {availableTabs.length ? (
              <div className="mp-info-tabs" role="tablist">
                {availableTabs.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    className={`mp-tab-btn${tab === key ? ' is-active' : ''}`}
                    onClick={() => {
                      setTab(key);
                      setOpenInstructions(null);
                    }}
                  >
                    {TAB_LABELS[key]}
                  </button>
                ))}
              </div>
            ) : null}

            {availableTabs.length === 0 ? (
              <p className="mp-empty">لا يوجد محتوى متاح حالياً.</p>
            ) : (
              <div className="mp-info-section">
                <h2 className="mp-section-title">{active.sectionTitle}</h2>
                {active.sectionSubtitle ? (
                  <p className="mp-section-subtitle">{active.sectionSubtitle}</p>
                ) : null}

                {tab === 'items' ? (
                  <div className="mp-items-grid">
                    {data.tabs.items.entries.map((item) => (
                      <article key={item.id} className="mp-item-card">
                        <div className="mp-item-media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                        <div className="mp-item-body">
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                          {item.instructions?.length ? (
                            <>
                              <button
                                type="button"
                                className="mp-instructions-toggle"
                                onClick={() =>
                                  setOpenInstructions((prev) =>
                                    prev === item.id ? null : item.id,
                                  )
                                }
                              >
                                {openInstructions === item.id
                                  ? 'إخفاء التعليمات'
                                  : 'التعليمات'}
                              </button>
                              <div
                                className={`mp-instructions${
                                  openInstructions === item.id ? ' is-open' : ''
                                }`}
                              >
                                <h4>تعليمات {item.name}</h4>
                                <ol>
                                  {item.instructions.map((step, index) => (
                                    <li key={`${item.id}-${index}`}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                {tab === 'about' ? (
                  <div className="mp-about-grid">
                    {data.tabs.about.entries.map((card) => (
                      <article key={card.id} className="mp-about-card">
                        <div className="mp-about-icon">
                          <AboutIcon iconKey={card.iconKey} />
                        </div>
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                      </article>
                    ))}
                  </div>
                ) : null}

                {tab === 'story' ? (
                  <div className="mp-story-list">
                    {data.tabs.story.entries.map((block) => (
                      <article
                        key={block.id}
                        className={`mp-story-block${
                          block.variant === 'highlight' ? ' is-highlight' : ''
                        }${
                          block.variant === 'conclusion' ? ' is-conclusion' : ''
                        }`}
                      >
                        <div className="mp-story-media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={block.imageUrl}
                            alt={block.title || ''}
                          />
                        </div>
                        <div className="mp-story-text">
                          {block.title ? <h3>{block.title}</h3> : null}
                          {paragraphs(block.body).map((para, index) => (
                            <p key={`${block.id}-${index}`}>{para}</p>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {data.footerText ? (
              <div className="mp-footer">
                <span className="mp-footer-dot" aria-hidden />
                <span>{data.footerText}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

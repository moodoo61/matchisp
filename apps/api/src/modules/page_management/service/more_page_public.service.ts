import { Injectable } from '@nestjs/common';
import { PageCardFlagsService } from './page_card_flags.service';
import { MorePageSettingsService } from './more_page_settings.service';
import { MorePageItemsService } from './more_page_items.service';
import { MorePageAboutService } from './more_page_about.service';
import { MorePageStoryService } from './more_page_story.service';

/** تجميع محتوى صفحة المزيد للعرض العام */
@Injectable()
export class MorePagePublicService {
  constructor(
    private readonly flags: PageCardFlagsService,
    private readonly settings: MorePageSettingsService,
    private readonly items: MorePageItemsService,
    private readonly about: MorePageAboutService,
    private readonly story: MorePageStoryService,
  ) {}

  async getPublic() {
    const enabled = await this.flags.isEnabled('more_page');
    if (!enabled) {
      return {
        enabled: false,
        hero: { title: '', subtitle: '' },
        footerText: '',
        tabs: {
          items: {
            enabled: false,
            sectionTitle: '',
            sectionSubtitle: '',
            entries: [],
          },
          about: {
            enabled: false,
            sectionTitle: '',
            sectionSubtitle: '',
            entries: [],
          },
          story: {
            enabled: false,
            sectionTitle: '',
            sectionSubtitle: '',
            entries: [],
          },
        },
      };
    }

    const [settings, itemsEnabled, aboutEnabled, storyEnabled] =
      await Promise.all([
        this.settings.get(),
        this.flags.isEnabled('more_page_items'),
        this.flags.isEnabled('more_page_about'),
        this.flags.isEnabled('more_page_story'),
      ]);

    // listPublic يفحص علم التبويب داخلياً؛ نستدعيه دائماً لتجنّب تكرار المنطق
    const [itemEntries, aboutEntries, storyEntries] = await Promise.all([
      this.items.listPublic(),
      this.about.listPublic(),
      this.story.listPublic(),
    ]);

    return {
      enabled: true,
      hero: {
        title: settings.heroTitle,
        subtitle: settings.heroSubtitle,
      },
      footerText: settings.footerText,
      tabs: {
        items: {
          enabled: itemsEnabled,
          sectionTitle: settings.itemsSectionTitle,
          sectionSubtitle: settings.itemsSectionSubtitle,
          entries: itemEntries,
        },
        about: {
          enabled: aboutEnabled,
          sectionTitle: settings.aboutSectionTitle,
          sectionSubtitle: settings.aboutSectionSubtitle,
          entries: aboutEntries,
        },
        story: {
          enabled: storyEnabled,
          sectionTitle: settings.storySectionTitle,
          sectionSubtitle: settings.storySectionSubtitle,
          entries: storyEntries,
        },
      },
    };
  }
}

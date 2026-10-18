export type PublicMoreItem = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  instructions: string[] | null;
  sortOrder: number;
};

export type PublicMoreAbout = {
  id: string;
  title: string;
  body: string;
  iconKey: string;
  sortOrder: number;
};

export type PublicMoreStory = {
  id: string;
  title: string | null;
  body: string;
  imageUrl: string;
  variant: string;
  sortOrder: number;
};

export type PublicMoreTab<T> = {
  enabled: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  entries: T[];
};

export type PublicMorePage = {
  enabled: boolean;
  hero: { title: string; subtitle: string };
  footerText: string;
  tabs: {
    items: PublicMoreTab<PublicMoreItem>;
    about: PublicMoreTab<PublicMoreAbout>;
    story: PublicMoreTab<PublicMoreStory>;
  };
};

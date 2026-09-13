export type LayoutType = 'grid' | 'full-width' | 'row-height' | 'original';

export interface ImageItem {
  id: string;
  url: string;
  file?: File;
  caption?: string;
}

export interface AppState {
  images: ImageItem[];
  layout: LayoutType;
  theme: 'light' | 'dark';
  viewMode: 'edit' | 'preview' | 'published';
  publishedId?: string;
}

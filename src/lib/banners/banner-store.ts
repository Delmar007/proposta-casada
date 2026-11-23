export type BannerTransitionType = 'top-to-bottom' | 'side-to-side' | 'fade';

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  transition: BannerTransitionType;
  durationSeconds: number;
  active: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'mp_custom_banners';
export const BANNERS_UPDATED_EVENT = 'mp-banners-updated';

export const BANNER_TRANSITION_LABELS: Record<BannerTransitionType, string> = {
  'top-to-bottom': 'De cima para baixo',
  'side-to-side': 'De um lado para o outro',
  fade: 'Suave (Fade)',
};

export function loadStoredBanners(): BannerItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is BannerItem =>
        Boolean(b && typeof b.id === 'string' && typeof b.imageUrl === 'string')
    );
  } catch {
    return [];
  }
}

export function saveStoredBanners(banners: BannerItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
  window.dispatchEvent(new Event(BANNERS_UPDATED_EVENT));
}

/**
 * Converte um arquivo de imagem importado em Data URL otimizado para 1024x250.
 */
export function processBannerImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo não é uma imagem válida.'));
      img.onload = () => {
        const targetWidth = 1024;
        const targetHeight = Math.min(250, Math.round((img.height / img.width) * targetWidth) || 250);
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

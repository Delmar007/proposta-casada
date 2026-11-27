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
const IDB_NAME = 'mp_banners_db';
const IDB_STORE = 'banners_store';
const IDB_KEY = 'all_banners';
export const BANNERS_UPDATED_EVENT = 'mp-banners-updated';

export const BANNER_TRANSITION_LABELS: Record<BannerTransitionType, string> = {
  'top-to-bottom': 'De cima para baixo',
  'side-to-side': 'De um lado para o outro',
  fade: 'Suave (Fade)',
};

function openBannerDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function loadBannersFromIdb(): Promise<BannerItem[]> {
  const db = await openBannerDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        const val = req.result;
        resolve(Array.isArray(val) ? val : []);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function saveBannersToIdb(banners: BannerItem[]): Promise<void> {
  const db = await openBannerDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(banners, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
  } catch {
    // Ignora QuotaExceededError do localStorage quando houver muitos banners;
    // a persistência principal ilimitada fica no servidor (/api/banners) + IndexedDB.
  }
  window.dispatchEvent(new Event(BANNERS_UPDATED_EVENT));
}

/**
 * Carrega banners persistidos (API do servidor + IndexedDB ilimitado + migração de localStorage).
 * Garante que os banners nunca desapareçam ao reabrir o site e suporta quantidade ilimitada.
 */
export async function fetchPersistedBanners(): Promise<BannerItem[]> {
  let serverBanners: BannerItem[] = [];
  try {
    const res = await fetch('/api/banners', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.banners)) {
        serverBanners = data.banners;
      }
    }
  } catch {
    // Fallback para IndexedDB/localStorage se offline
  }

  const idbBanners = await loadBannersFromIdb();
  const legacyBanners = loadStoredBanners();

  if (serverBanners.length > 0) {
    await saveBannersToIdb(serverBanners);
    return serverBanners;
  }

  const localFallback = idbBanners.length > 0 ? idbBanners : legacyBanners;
  if (localFallback.length > 0) {
    // Restaura no servidor e no IndexedDB para permanecerem sempre ativos
    await saveBannersToIdb(localFallback);
    try {
      await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: localFallback }),
      });
    } catch {
      // ignora erro de rede temporário
    }
    return localFallback;
  }

  return [];
}

/**
 * Salva banners de forma ilimitada no IndexedDB e sincroniza no servidor (/api/banners).
 */
export async function savePersistedBanners(banners: BannerItem[]): Promise<void> {
  await saveBannersToIdb(banners);
  saveStoredBanners(banners);
  try {
    await fetch('/api/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banners }),
    });
  } catch {
    // IndexedDB já garantiu a persistência local sem limite de 5MB
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(BANNERS_UPDATED_EVENT));
  }
}

/**
 * Lê um arquivo de imagem como Data URL original (sem cortar) para permitir
 * posicionamento e zoom livres dentro da grade 1024x250.
 */
export function readBannerFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/**
 * Renderiza a imagem posicionada (panX/panY em [-1, 1] e zoom >= 1)
 * exatamente dentro da grade final de 1024 x 250 px.
 */
export function renderPositionedBannerToDataUrl(
  imageUrl: string,
  panX: number,
  panY: number,
  zoom: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Não foi possível processar a imagem do banner.'));
    img.onload = () => {
      const targetWidth = 1024;
      const targetHeight = 250;
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      const baseScale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const scale = baseScale * Math.max(1, zoom);
      const drawW = img.width * scale;
      const drawH = img.height * scale;

      const maxOffsetX = Math.max(0, (drawW - targetWidth) / 2);
      const maxOffsetY = Math.max(0, (drawH - targetHeight) / 2);
      const clampedPanX = Math.max(-1, Math.min(1, panX));
      const clampedPanY = Math.max(-1, Math.min(1, panY));

      const x = (targetWidth - drawW) / 2 + clampedPanX * maxOffsetX;
      const y = (targetHeight - drawH) / 2 + clampedPanY * maxOffsetY;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, x, y, drawW, drawH);

      try {
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(imageUrl);
      }
    };
    img.src = imageUrl;
  });
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

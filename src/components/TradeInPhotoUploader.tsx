'use client';

import React, { useRef } from 'react';
import { ArrowDown, ArrowUp, Camera, RefreshCw, Trash2, Upload } from 'lucide-react';
import { PHOTO_SLOT_LABELS } from '@/lib/domain/types';

export interface UploadedPhotoItem {
  id: string;
  dataUrl: string;
  slotLabel: string;
}

interface TradeInPhotoUploaderProps {
  photos: UploadedPhotoItem[];
  onChange: (photos: UploadedPhotoItem[]) => void;
  maxPhotos?: number;
  title?: string;
  hint?: string;
}

export function TradeInPhotoUploader({
  photos,
  onChange,
  maxPhotos = 12,
  title = 'Fotografias do Veículo Oferecido',
  hint = 'Orientações: 1. Frente • 2. Traseira • 3. Lateral direita • 4. Lateral esquerda • 5. Interior • 6. Painel e quilometragem',
}: TradeInPhotoUploaderProps) {
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1280;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
            return;
          }
        } catch {
          // fallback para FileReader abaixo
        }
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = maxPhotos - photos.length;
    const selected = files.slice(0, remaining);

    const added: UploadedPhotoItem[] = [];
    for (let i = 0; i < selected.length; i++) {
      try {
        const dataUrl = await readFileAsDataUrl(selected[i]);
        const orderIdx = photos.length + added.length;
        added.push({
          id: `${Date.now()}-${orderIdx}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl,
          slotLabel: PHOTO_SLOT_LABELS[orderIdx] ?? `Foto ${orderIdx + 1}`,
        });
      } catch {
        // ignora arquivo corrompido sem interromper os demais
      }
    }

    if (added.length > 0) {
      onChange([...photos, ...added]);
    }
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    const next = photos
      .filter((_, idx) => idx !== index)
      .map((p, idx) => ({
        ...p,
        slotLabel: PHOTO_SLOT_LABELS[idx] ?? `Foto ${idx + 1}`,
      }));
    onChange(next);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const copy = [...photos];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(
      copy.map((p, idx) => ({
        ...p,
        slotLabel: PHOTO_SLOT_LABELS[idx] ?? `Foto ${idx + 1}`,
      }))
    );
  };

  const triggerReplace = (index: number) => {
    replaceIndexRef.current = index;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = replaceIndexRef.current;
    if (!file || idx === null) return;
    const dataUrl = await readFileAsDataUrl(file);
    const copy = [...photos];
    copy[idx] = { ...copy[idx], dataUrl };
    onChange(copy);
    e.target.value = '';
    replaceIndexRef.current = null;
  };

  return (
    <div className="space-y-4 rounded-xl border border-logo-purple/25 bg-logo-purple/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {(title || hint) && (
          <div>
            {title && (
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Camera className="h-4 w-4 text-logo-purple" />
                {title} ({photos.length}/{maxPhotos})
              </h4>
            )}
            {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
          </div>
        )}

        {photos.length < maxPhotos && (
          <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-logo-green px-3 py-2 text-xs font-extrabold text-logo-purple-950 hover:bg-logo-green-hover">
            <Upload className="h-3.5 w-3.5" />
            Adicionar fotos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddFiles}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplaceFile}
        className="sr-only"
      />

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-xs font-semibold text-slate-500">
          {maxPhotos} imagens
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative h-32 w-full bg-slate-100">
                <img
                  src={photo.dataUrl}
                  alt={photo.slotLabel}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded bg-uva-700/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {photo.slotLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    title="Mover para cima"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === photos.length - 1}
                    className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => triggerReplace(index)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                    title="Substituir"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Substituir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';

interface BrandLogoProps {
  brand: string;
  size?: number;
  className?: string;
}

/**
 * Renderiza o emblema/logo oficial estilizado da marca automotiva com tamanho exato de 30x30 px.
 */
export function BrandLogo({ brand, size = 30, className = '' }: BrandLogoProps) {
  const normalized = brand.trim().toLowerCase();

  if (normalized.includes('toyota')) {
    return (
      <div
        style={{ width: size, height: size }}
        title="Toyota"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 30 30" width={size - 4} height={size - 4} fill="none">
          <ellipse cx="15" cy="15" rx="12" ry="8.2" stroke="#DC2626" strokeWidth="1.9" />
          <ellipse cx="15" cy="15" rx="4" ry="8" stroke="#DC2626" strokeWidth="1.7" />
          <ellipse cx="15" cy="12.2" rx="8.2" ry="3.4" stroke="#DC2626" strokeWidth="1.7" />
        </svg>
      </div>
    );
  }

  if (normalized.includes('honda')) {
    return (
      <div
        style={{ width: size, height: size }}
        title="Honda"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 30 30" width={size - 4} height={size - 4} fill="none">
          <rect x="4" y="6" width="22" height="18" rx="4.5" stroke="#0F172A" strokeWidth="1.9" />
          <path
            d="M10 9.5L11.2 20.5M20 9.5L18.8 20.5M10.7 15H19.3"
            stroke="#0F172A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (normalized.includes('volkswagen') || normalized === 'vw') {
    return (
      <div
        style={{ width: size, height: size }}
        title="Volkswagen"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 30 30" width={size - 4} height={size - 4} fill="none">
          <circle cx="15" cy="15" r="11.5" stroke="#1D4ED8" strokeWidth="1.9" />
          <path
            d="M10.2 7.5L15 16.5L19.8 7.5M7.5 11.5L12.3 22L15 16.8L17.7 22L22.5 11.5"
            stroke="#1D4ED8"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (normalized.includes('hyundai')) {
    return (
      <div
        style={{ width: size, height: size }}
        title="Hyundai"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 30 30" width={size - 4} height={size - 4} fill="none">
          <ellipse cx="15" cy="15" rx="12" ry="8" stroke="#0369A1" strokeWidth="1.9" />
          <path
            d="M10 19.5L12.5 10.5M17.5 19.5L20 10.5M11.2 15.2C13.5 14 16.5 14 18.8 14.8"
            stroke="#0369A1"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (normalized.includes('jeep')) {
    return (
      <div
        style={{ width: size, height: size }}
        title="Jeep"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-uva-700 text-[9px] font-black tracking-tighter text-white shadow-2xs ${className}`}
      >
        JEEP
      </div>
    );
  }

  if (normalized.includes('chevrolet') || normalized.includes('gm')) {
    return (
      <div
        style={{ width: size, height: size }}
        title="Chevrolet"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 30 30" width={size - 4} height={size - 4} fill="none">
          <path
            d="M4 13.2H11.5V10.5H18.5V13.2H26L24.4 16.8H18.5V19.5H11.5V16.8H5.6L4 13.2Z"
            fill="#D97706"
            stroke="#B45309"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    );
  }

  const initials = brand.slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      title={brand}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-uva-700 text-[10px] font-bold text-white ${className}`}
    >
      {initials}
    </div>
  );
}

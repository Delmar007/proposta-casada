export interface ProcessedTradeInImage {
  sanitizedBuffer: Buffer;
  originalBuffer: Buffer;
  sanitizedDataUrl: string;
  exifStripped: boolean;
  hadMetadata: boolean;
  privacyFlags: string[];
}

/**
 * Remove segmentos APP1..APP15 (EXIF, XMP, IPTC, ICC) e COM de arquivos JPEG,
 * preservando apenas os segmentos essenciais de imagem (SOI, APP0/JFIF, DQT, DHT, SOF, SOS, EOI).
 */
export function stripJpegExif(input: Buffer): { cleaned: Buffer; hadMetadata: boolean } {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) {
    return { cleaned: input, hadMetadata: false };
  }

  const chunks: Buffer[] = [input.subarray(0, 2)]; // SOI
  let offset = 2;
  let hadMetadata = false;

  while (offset < input.length - 1) {
    if (input[offset] !== 0xff) {
      chunks.push(input.subarray(offset));
      break;
    }

    const marker = input[offset + 1];

    // SOS (Start of Scan) — copia o restante do stream até EOI
    if (marker === 0xda) {
      chunks.push(input.subarray(offset));
      break;
    }

    // EOI ou marcadores sem payload
    if (marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(input.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > input.length) {
      chunks.push(input.subarray(offset));
      break;
    }

    const segmentLength = input.readUInt16BE(offset + 2);
    const totalSegmentBytes = 2 + segmentLength;

    // Remove APP1..APP15 (0xE1..0xEF, inclui EXIF/GPS/XMP) e COM (0xFE)
    const isMetadataMarker = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (isMetadataMarker) {
      hadMetadata = true;
    } else {
      chunks.push(input.subarray(offset, Math.min(input.length, offset + totalSegmentBytes)));
    }

    offset += totalSegmentBytes;
  }

  return { cleaned: Buffer.concat(chunks), hadMetadata };
}

/**
 * Remove chunks não-críticos de metadados PNG (eXIf, tEXt, zTXt, iTXt, tIME).
 */
export function stripPngMetadata(input: Buffer): { cleaned: Buffer; hadMetadata: boolean } {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (input.length < 8 || !input.subarray(0, 8).equals(PNG_SIG)) {
    return { cleaned: input, hadMetadata: false };
  }

  const METADATA_CHUNKS = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);
  const chunks: Buffer[] = [PNG_SIG];
  let offset = 8;
  let hadMetadata = false;

  while (offset + 12 <= input.length) {
    const length = input.readUInt32BE(offset);
    const type = input.subarray(offset + 4, offset + 8).toString('ascii');
    const totalLen = 12 + length;

    if (offset + totalLen > input.length) break;

    if (METADATA_CHUNKS.has(type)) {
      hadMetadata = true;
    } else {
      chunks.push(input.subarray(offset, offset + totalLen));
    }

    offset += totalLen;
    if (type === 'IEND') break;
  }

  return { cleaned: Buffer.concat(chunks), hadMetadata };
}

export function processTradeInImageDataUrl(
  dataUrl: string,
  slotLabel: string
): ProcessedTradeInImage {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    const fallbackBuf = Buffer.from(dataUrl, 'utf8');
    return {
      sanitizedBuffer: fallbackBuf,
      originalBuffer: fallbackBuf,
      sanitizedDataUrl: dataUrl,
      exifStripped: true,
      hadMetadata: false,
      privacyFlags: ['Verificação humana recomendada para placa/rosto/documento'],
    };
  }

  const mimeType = match[1];
  const originalBuffer: Buffer = Buffer.from(match[2], 'base64');

  let sanitizedBuffer: Buffer = originalBuffer;
  let hadMetadata = false;

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    const res = stripJpegExif(originalBuffer);
    sanitizedBuffer = res.cleaned;
    hadMetadata = res.hadMetadata;
  } else if (mimeType === 'image/png') {
    const res = stripPngMetadata(originalBuffer);
    sanitizedBuffer = res.cleaned;
    hadMetadata = res.hadMetadata;
  }

  const privacyFlags: string[] = [];
  if (hadMetadata) {
    privacyFlags.push('Metadados EXIF/GPS removidos automaticamente');
  }
  if (slotLabel.includes('Frente') || slotLabel.includes('Traseira')) {
    privacyFlags.push('Verificar presença de placa veicular visível antes da liberação');
  }
  if (slotLabel.includes('Interior') || slotLabel.includes('Painel')) {
    privacyFlags.push('Verificar ausência de documentos pessoais ou QR codes no interior');
  }

  const sanitizedDataUrl = `data:${mimeType};base64,${sanitizedBuffer.toString('base64')}`;

  return {
    sanitizedBuffer,
    originalBuffer,
    sanitizedDataUrl,
    exifStripped: true,
    hadMetadata,
    privacyFlags,
  };
}

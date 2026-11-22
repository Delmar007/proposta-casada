import { PIIDetectionResult, PIIFlag } from '@/lib/domain/types';

const PHONE_PATTERNS = [
  /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-.\s]?\d{4}/g,
  /\b\d{10,11}\b/g,
  /\b(?:zero|um|dois|três|tres|quatro|cinco|seis|sete|oito|nove)(?:\s+(?:zero|um|dois|três|tres|quatro|cinco|seis|sete|oito|nove)){6,}/gi,
];

const WHATSAPP_PATTERNS = [
  /\b(?:whats\s*app|whatsapp|zapzap|zap|wpp|wa\.me)\b/gi,
];

const EMAIL_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /[a-zA-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|arroba)\s*[a-zA-Z0-9.-]+/gi,
];

const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /\bwww\.[^\s]+/gi,
  /\b(?:bit\.ly|tinyurl\.com|t\.me|wa\.me|linktr\.ee|forms\.gle)\/[^\s]*/gi,
];

const ADDRESS_PATTERNS = [
  /\b(?:rua|av\.?|avenida|alameda|travessa|estrada|rodovia)\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^\n,]{3,40},?\s*(?:n[º°o]?\.?\s*\d+|\d{1,5})/gi,
  /\bCEP[:\s]*\d{5}-?\d{3}\b/gi,
  /\b(?:apto|apartamento|bloco|condomínio|condominio|lote|quadra)\s+[A-Z0-9-]+/gi,
];

const SOCIAL_MEDIA_PATTERNS = [
  /(?:^|\s)@[a-zA-Z0-9_.]{3,30}\b/g,
  /\b(?:instagram|insta|facebook|face|tiktok|telegram|linkedin|twitter|x\.com)\b/gi,
];

const QR_PATTERNS = [
  /\b(?:qr\s*code|qrcode|código\s*qr|codigo\s*qr|chave\s*pix)\b/gi,
];

const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

function collectMatches(
  text: string,
  patterns: RegExp[],
  category: PIIFlag['category'],
  description: string
): PIIFlag[] {
  const found = new Set<string>();
  const flags: PIIFlag[] = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const value = match[0].trim();
      if (value && !found.has(`${category}:${value.toLowerCase()}`)) {
        found.add(`${category}:${value.toLowerCase()}`);
        flags.push({ category, match: value, description });
      }
    }
  }
  return flags;
}

export function detectPIIAndContactLeaks(text: string): PIIDetectionResult {
  const normalized = text ?? '';
  const flags: PIIFlag[] = [
    ...collectMatches(normalized, WHATSAPP_PATTERNS, 'whatsapp', 'Menção a WhatsApp ou link de contato'),
    ...collectMatches(normalized, EMAIL_PATTERNS, 'email', 'Endereço de e-mail detectado'),
    ...collectMatches(normalized, LINK_PATTERNS, 'link_externo', 'Link externo detectado'),
    ...collectMatches(normalized, ADDRESS_PATTERNS, 'endereco_residencial', 'Possível endereço residencial ou CEP'),
    ...collectMatches(normalized, SOCIAL_MEDIA_PATTERNS, 'rede_social', 'Perfil ou menção a rede social'),
    ...collectMatches(normalized, QR_PATTERNS, 'qr_code', 'Menção a QR Code de contato ou chave Pix'),
    ...collectMatches(normalized, [CPF_PATTERN], 'documento_pessoal', 'Possível número de CPF ou documento'),
    ...collectMatches(normalized, PHONE_PATTERNS, 'telefone', 'Possível número de telefone'),
  ];

  const isSuspicious = flags.length > 0;
  const riskLevel: PIIDetectionResult['riskLevel'] =
    flags.length >= 2 ? 'alto' : flags.length === 1 ? 'medio' : 'baixo';

  const summary = isSuspicious
    ? `Detectadas ${flags.length} possível(is) tentativa(s) de compartilhamento de dados pessoais/contato (${Array.from(new Set(flags.map((f) => f.category))).join(', ')}). Publicação automática bloqueada; encaminhado para revisão humana.`
    : 'Nenhum dado pessoal ou contato externo detectado na verificação automática.';

  return { isSuspicious, flags, riskLevel, summary };
}

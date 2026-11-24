import { BRAZIL_STATES } from '@/lib/geo/brazil-locations';

export interface ExtractedCnhData {
  fullName?: string;
  cpf?: string;
  rg?: string;
  cnhNumber?: string;
  local?: string;
  birthDate?: string;
  rawText: string;
}

function formatCpf(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  if (clean.length !== 11) return digits;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

function isValidCpfDigits(digits: string): boolean {
  const clean = digits.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(clean[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(clean[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(clean[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(clean[10]);
}

/**
 * Faz o parsing do texto extraído do PDF oficial da CNH Digital (tanto camada de texto quanto OCR)
 * para identificar CPF, RG, Nº de Registro da CNH, Data de Nascimento e Nome.
 */
export function parseCnhPdfText(rawText: string): ExtractedCnhData {
  const normalized = rawText.replace(/\r/g, '\n');
  const flat = normalized.replace(/\s+/g, ' ').trim();

  // 1. CPF (aceita 000.000.000-00, com espaços de OCR, ou 11 dígitos válidos)
  let cpf: string | undefined;
  const cpfFormatted = flat.match(/\b(\d{3}\s*[.,]\s*\d{3}\s*[.,]\s*\d{3}\s*[-–—]\s*\d{2})\b/);
  if (cpfFormatted) {
    const digits = cpfFormatted[1].replace(/\D/g, '');
    cpf = formatCpf(digits);
  }
  if (!cpf) {
    const cpfAfterLabel = flat.match(/CPF[^\d]{0,12}(\d{3}\D?\d{3}\D?\d{3}\D?\d{2})/i);
    if (cpfAfterLabel) {
      const digits = cpfAfterLabel[1].replace(/\D/g, '');
      if (digits.length === 11) cpf = formatCpf(digits);
    }
  }
  if (!cpf) {
    const all11 = Array.from(flat.matchAll(/\b(\d{11})\b/g)).map((m) => m[1]);
    const validCpf = all11.find((d) => isValidCpfDigits(d));
    if (validCpf) cpf = formatCpf(validCpf);
  }
  const cpfDigits = cpf ? cpf.replace(/\D/g, '') : '';

  // 2. Nº da CNH = Nº de Registro (sempre 11 dígitos, distinto do CPF; na CNH nova: "5 Nº REGISTRO")
  let cnhNumber: string | undefined;
  const cnhAfterLabel = flat.match(
    /(?:5\s*)?(?:N[º°o\.]?\s*REGISTRO|REGISTRO)[^\d]{0,25}(\d(?:\s*\d){10})/i
  );
  if (cnhAfterLabel) {
    const digits = cnhAfterLabel[1].replace(/\D/g, '');
    if (digits.length === 11 && digits !== cpfDigits) {
      cnhNumber = digits;
    }
  }
  if (!cnhNumber) {
    const elevenDigitMatches = Array.from(flat.matchAll(/\b(\d{11})\b/g)).map((m) => m[1]);
    cnhNumber = elevenDigitMatches.find((n) => n !== cpfDigits);
  }

  // 3. Data de Nascimento (DD/MM/AAAA — aceita "/" ou "-" de OCR)
  let birthDate: string | undefined;
  const birthAfterLabel = flat.match(
    /(?:DATA\s*(?:DE\s*)?NASCIMENTO|NASCIMENTO|NASC\.?)[^\d]{0,18}(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i
  );
  if (birthAfterLabel) {
    birthDate = birthAfterLabel[1].replace(/-/g, '/');
  } else {
    const allDates = Array.from(
      flat.matchAll(/\b(\d{2}[\/\-]\d{2}[\/\-](?:19\d{2}|20[0-2]\d))\b/g)
    ).map((m) => m[1].replace(/-/g, '/'));
    const plausibleBirths = allDates
      .filter((d) => {
        const year = Number(d.slice(6, 10));
        return year >= 1925 && year <= new Date().getFullYear() - 18;
      })
      .sort((a, b) => Number(a.slice(6, 10)) - Number(b.slice(6, 10)));
    birthDate = plausibleBirths[0];
  }

  // 4. RG / Doc. Identidade (números de 5 a 12 dígitos/letras próximos a IDENTIDADE / RG / SSP / DETRAN / PC)
  let rg: string | undefined;
  const rgAfterLabel = flat.match(
    /(?:DOC\.?\s*IDENTIDADE|IDENTIDADE|ORG\.?\s*EMISSOR|4c\s*DOC)[^0-9A-Z]{0,20}([0-9]{5,12}(?:[-.]?[0-9X])?(?:\s+(?:SSP|DETRAN|SESP|PC|IFP|IGP|SDS|SEJUSP|DIC|II)(?:\s+[A-Z]{2})?)?)/i
  );
  if (rgAfterLabel) {
    const candidate = rgAfterLabel[1].trim();
    if (!cpfDigits || !candidate.replace(/\D/g, '').includes(cpfDigits)) {
      rg = candidate;
    }
  }
  if (!rg) {
    const sspMatch = flat.match(
      /\b([0-9]{5,10}[-.]?[0-9X]?)\s+(?:SSP|DETRAN|SESP|PC|IFP|IGP|SDS|SEJUSP|DIC)\b(?:\s+[A-Z]{2})?/i
    );
    if (sspMatch) {
      rg = sspMatch[0].trim();
    }
  }

  // 5. Local (Cidade e UF — ex.: "CAMPO GRANDE, MS", "CAMPO GRANDE MS", "SÃO PAULO - SP")
  let local: string | undefined;
  const UF_PATTERN =
    'AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO';
  const ORG_EMISSOR_RE = /\b(?:SSP|DETRAN|SESP|PC|IFP|IGP|SDS|SEJUSP|DIC|II|DGPC|POLITEC)\b/i;

  const normalizeNoAccent = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

  // 5a. Busca por linha contendo "LOCAL" ou linha imediatamente abaixo de "LOCAL"
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (/\bLOCAL\b/i.test(lines[i]) && !/NASCIMENTO/i.test(lines[i])) {
      const windowText = [lines[i], lines[i + 1] ?? '', lines[i + 2] ?? ''].join(' ');
      const m = windowText.match(
        new RegExp(
          `([A-ZÀ-Ú][A-ZÀ-Ú\\s'.]{2,32})\\s*[,\\-\\/\\s]\\s*(${UF_PATTERN})\\b`
        )
      );
      if (m && !ORG_EMISSOR_RE.test(m[1]) && !/\bLOCAL\b/i.test(m[1])) {
        const cleanCity = m[1]
          .replace(/^.*\b(?:LOCAL|EMISS[AÃ]O|DATA)\b\s*/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanCity.length >= 3) {
          local = `${cleanCity}, ${m[2].toUpperCase()}`;
          break;
        }
      }
    }
  }

  // 5b. Busca por "CIDADE, UF" ou "CIDADE - UF" em qualquer ponto (ignorando órgão emissor)
  if (!local) {
    const matches = Array.from(
      flat.matchAll(
        new RegExp(
          `\\b([A-ZÀ-Ú][A-ZÀ-Ú\\s'.]{2,30})\\s*[,\\-\\/]\\s*(${UF_PATTERN})\\b`,
          'g'
        )
      )
    );
    for (const m of matches) {
      const cityCandidate = m[1]
        .replace(/^.*\b(?:LOCAL|EMISS[AÃ]O|NASCIMENTO|DATA|DETRAN)\b\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cityCandidate.length >= 3 && !ORG_EMISSOR_RE.test(cityCandidate)) {
        local = `${cityCandidate}, ${m[2].toUpperCase()}`;
        break;
      }
    }
  }

  // 5c. Fallback infalível: procura qualquer cidade oficial de BRAZIL_STATES + sua UF no texto OCR
  if (!local) {
    const flatUpper = normalizeNoAccent(flat);
    for (const st of BRAZIL_STATES) {
      for (const city of st.cities) {
        const cityUpper = normalizeNoAccent(city);
        const cityRegex = new RegExp(
          `\\b${cityUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?:\\s*[,\\-\\/\\s]\\s*${st.uf}\\b)?`
        );
        const match = flatUpper.match(cityRegex);
        if (match && flatUpper.includes(st.uf)) {
          // Prefere quando a UF aparece logo depois da cidade
          if (match[0].endsWith(st.uf)) {
            local = `${city}, ${st.uf}`;
            break;
          }
        }
      }
      if (local) break;
    }
  }

  // 6. Nome Completo (linha após "NOME" ou "NOME E SOBRENOME")
  let fullName: string | undefined;
  const nameAfterLabel = normalized.match(
    /(?:NOME\s*E\s*SOBRENOME|2\s*E\s*1\s*NOME|NOME)\s*[:\n]+\s*([A-ZÀ-Ú][A-ZÀ-Ú\s]{4,70})/
  );
  if (nameAfterLabel) {
    const cleaned = nameAfterLabel[1]
      .split(/\n/)[0]
      .replace(/\b(?:DOC|IDENTIDADE|CPF|NASCIMENTO|FILIA[CÇ][AÃ]O|1A\s*HABILITACAO)\b.*$/i, '')
      .trim();
    if (cleaned.length >= 5) {
      fullName = cleaned;
    }
  }

  return {
    fullName,
    cpf,
    rg,
    cnhNumber,
    local,
    birthDate,
    rawText,
  };
}

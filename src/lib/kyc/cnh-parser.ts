export interface ExtractedCnhData {
  fullName?: string;
  cpf?: string;
  rg?: string;
  cnhNumber?: string;
  birthDate?: string;
  rawText: string;
}

function formatCpf(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  if (clean.length !== 11) return digits;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

/**
 * Faz o parsing do texto extraído do PDF oficial da CNH Digital (Carteira Digital de Trânsito)
 * para identificar CPF, RG, Nº de Registro da CNH, Data de Nascimento e Nome.
 */
export function parseCnhPdfText(rawText: string): ExtractedCnhData {
  const normalized = rawText.replace(/\r/g, '\n');
  const flat = normalized.replace(/\s+/g, ' ').trim();

  // 1. CPF (formato 000.000.000-00 ou 11 dígitos após "CPF")
  let cpf: string | undefined;
  const cpfFormatted = flat.match(/\b(\d{3}\.\d{3}\.\d{3}-\d{2})\b/);
  if (cpfFormatted) {
    cpf = cpfFormatted[1];
  } else {
    const cpfAfterLabel = flat.match(/CPF[:\s]*(\d{11})/i);
    if (cpfAfterLabel) cpf = formatCpf(cpfAfterLabel[1]);
  }
  const cpfDigits = cpf ? cpf.replace(/\D/g, '') : '';

  // 2. Nº de Registro da CNH (11 dígitos, distinto do CPF)
  let cnhNumber: string | undefined;
  const cnhAfterLabel = flat.match(
    /(?:N[º°o\.]?\s*REGISTRO|REGISTRO|CNH)[:\s]*([0-9]{9,11})/i
  );
  if (cnhAfterLabel && cnhAfterLabel[1] !== cpfDigits) {
    cnhNumber = cnhAfterLabel[1];
  } else {
    const elevenDigitMatches = Array.from(flat.matchAll(/\b(\d{11})\b/g)).map((m) => m[1]);
    cnhNumber = elevenDigitMatches.find((n) => n !== cpfDigits);
  }

  // 3. Data de Nascimento (DD/MM/AAAA — prioriza a que aparece perto de "NASCIMENTO" ou a data mais antiga válida < 2012)
  let birthDate: string | undefined;
  const birthAfterLabel = flat.match(
    /(?:DATA\s*(?:DE\s*)?NASCIMENTO|NASCIMENTO|NASC\.?)[:\s]*(\d{2}\/\d{2}\/\d{4})/i
  );
  if (birthAfterLabel) {
    birthDate = birthAfterLabel[1];
  } else {
    const allDates = Array.from(flat.matchAll(/\b(\d{2}\/\d{2}\/(?:19\d{2}|20[0-2]\d))\b/g)).map(
      (m) => m[1]
    );
    const plausibleBirths = allDates
      .filter((d) => {
        const year = Number(d.slice(6, 10));
        return year >= 1925 && year <= new Date().getFullYear() - 18;
      })
      .sort((a, b) => Number(a.slice(6, 10)) - Number(b.slice(6, 10)));
    birthDate = plausibleBirths[0];
  }

  // 4. RG / Doc. Identidade (números de 6 a 12 dígitos/letras próximos a IDENTIDADE / RG / SSP / ORG EMISSOR)
  let rg: string | undefined;
  const rgAfterLabel = flat.match(
    /(?:DOC\.?\s*IDENTIDADE|IDENTIDADE|RG)[:\s]*([0-9A-Z.\-]{5,15}(?:\s+[A-Z]{2,6}(?:\s+[A-Z]{2})?)?)/i
  );
  if (rgAfterLabel) {
    const candidate = rgAfterLabel[1].trim();
    if (!cpf || !candidate.includes(cpf)) {
      rg = candidate;
    }
  }
  if (!rg) {
    const sspMatch = flat.match(/\b([0-9]{5,10}-?[0-9X]?)\s+(?:SSP|DETRAN|SESP|PC|IFP|IGP|SDS)\b/i);
    if (sspMatch) {
      rg = sspMatch[0].trim();
    }
  }

  // 5. Nome Completo (linha após "NOME" ou "NOME E SOBRENOME")
  let fullName: string | undefined;
  const nameAfterLabel = normalized.match(
    /(?:NOME\s*E\s*SOBRENOME|NOME)\s*[:\n]+\s*([A-ZÀ-Ú][A-ZÀ-Ú\s]{4,70})/
  );
  if (nameAfterLabel) {
    const cleaned = nameAfterLabel[1]
      .split(/\n/)[0]
      .replace(/\b(?:DOC|IDENTIDADE|CPF|NASCIMENTO|FILIA[CÇ][AÃ]O)\b.*$/i, '')
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
    birthDate,
    rawText,
  };
}

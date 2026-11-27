import { ExtractedCnhData, parseCnhPdfText } from './cnh-parser';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfjsLib?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tesseract?: any;
  }
}

const PDFJS_SCRIPT_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const FACEAPI_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js';
const FACEAPI_MODEL_URL =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';
const TESSERACT_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}`)), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(script);
  });
}

let faceModelsLoaded = false;

export async function ensureFaceModelsLoaded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!window.faceapi) {
    await loadScriptOnce(FACEAPI_SCRIPT_URL);
  }
  if (!window.faceapi) {
    throw new Error('Biblioteca de reconhecimento facial indisponível no navegador.');
  }
  if (window.faceapi.tf) {
    try {
      await window.faceapi.tf.setBackend('webgl');
    } catch {
      try {
        await window.faceapi.tf.setBackend('cpu');
      } catch {
        // segue com backend padrão
      }
    }
    await window.faceapi.tf.ready();
  }
  if (!faceModelsLoaded) {
    await Promise.all([
      window.faceapi.nets.tinyFaceDetector.loadFromUri(FACEAPI_MODEL_URL),
      window.faceapi.nets.faceLandmark68Net.loadFromUri(FACEAPI_MODEL_URL),
      window.faceapi.nets.faceRecognitionNet.loadFromUri(FACEAPI_MODEL_URL),
    ]);
    faceModelsLoaded = true;
  }
}

export interface ParsedCnhPdfResult {
  imageDataUrl: string;
  extracted: ExtractedCnhData;
}

function trimCanvasWhiteSpace(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext('2d');
  if (!ctx) return source;
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);

  let top = height;
  let bottom = 0;
  let left = width;
  let right = 0;

  // Passo de 2px para ser instantâneo mesmo em canvas A4 2.5x
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a > 20 && (r < 244 || g < 244 || b < 244)) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (bottom <= top || right <= left) return source;

  const pad = 12;
  const cropX = Math.max(0, left - pad);
  const cropY = Math.max(0, top - pad);
  const cropW = Math.min(width - cropX, right - left + pad * 2);
  const cropH = Math.min(height - cropY, bottom - top + pad * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = cropW;
  trimmed.height = cropH;
  const tCtx = trimmed.getContext('2d');
  if (!tCtx) return source;
  tCtx.fillStyle = '#ffffff';
  tCtx.fillRect(0, 0, cropW, cropH);
  tCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return trimmed;
}

/**
 * Lê o PDF exportado pela CNH Digital no navegador:
 * 1) Renderiza a página 1 em alta resolução (para exibição, arquivamento e detecção facial);
 * 2) Extrai todo o texto do PDF para identificar RG, CPF, CNH e Data de Nascimento.
 */
export async function processCnhDigitalPdf(
  file: File,
  onStatus?: (msg: string) => void
): Promise<ParsedCnhPdfResult> {
  onStatus?.('Carregando leitor de PDF...');
  if (!window.pdfjsLib) {
    await loadScriptOnce(PDFJS_SCRIPT_URL);
  }
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('Leitor de PDF indisponível no navegador.');
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  // Renderiza página 1 em alta resolução (para exibição, OCR e detecção facial)
  onStatus?.('Renderizando imagem da CNH Digital...');
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexto 2D indisponível para renderizar o PDF.');

  await page.render({ canvasContext: ctx, viewport }).promise;
  const croppedCanvas = trimCanvasWhiteSpace(canvas);
  const imageDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.92);

  // 1) Extrai camada de texto nativa do PDF (se existir)
  let fullText = '';
  const totalPages = Math.min(pdf.numPages, 2);
  for (let i = 1; i <= totalPages; i++) {
    const p = i === 1 ? page : await pdf.getPage(i);
    const textContent = await p.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = (textContent.items as any[])
      .map((item) => (typeof item.str === 'string' ? item.str : ''))
      .join(' ');
    fullText += `${pageText}\n`;
  }

  let extracted = parseCnhPdfText(fullText);

  // 2) PDFs exportados pela CNH Digital (CDT) geralmente são baseados em imagem;
  // se faltou CPF, RG, Local ou Data de Nascimento, executa OCR gratuito (Tesseract.js) na imagem!
  const missingCoreField =
    !extracted.cpf || !extracted.rg || !extracted.local || !extracted.birthDate;

  if (missingCoreField) {
    try {
      onStatus?.('Reconhecendo RG, CPF, Local e data de nascimento via OCR...');
      if (!window.Tesseract) {
        await loadScriptOnce(TESSERACT_SCRIPT_URL);
      }
      if (window.Tesseract) {
        const ocrResult = await window.Tesseract.recognize(imageDataUrl, 'por', {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logger: (m: any) => {
            if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
              onStatus?.(
                `Extraindo documentos da CNH (OCR ${Math.round(m.progress * 100)}%)...`
              );
            }
          },
        });
        const ocrText = String(ocrResult?.data?.text ?? '');
        if (ocrText.trim()) {
          const combined = `${fullText}\n${ocrText}`;
          const fromOcr = parseCnhPdfText(combined);
          extracted = {
            fullName: extracted.fullName || fromOcr.fullName,
            cpf: extracted.cpf || fromOcr.cpf,
            rg: extracted.rg || fromOcr.rg,
            cnhNumber: extracted.cnhNumber || fromOcr.cnhNumber,
            local: extracted.local || fromOcr.local,
            birthDate: extracted.birthDate || fromOcr.birthDate,
            rawText: combined,
          };
        }
      }
    } catch {
      // mantém os campos que já foram extraídos
    }
  }

  return { imageDataUrl, extracted };
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem para reconhecimento facial.'));
    img.src = src;
  });
}

export interface FaceComparisonResult {
  matched: boolean;
  similarityPercent: number;
  distance: number;
  message: string;
}

/**
 * Compara o rosto capturado na câmera (armação oval) com a face presente
 * na imagem renderizada do PDF da CNH Digital usando @vladmandic/face-api (100% gratuito).
 */
export async function compareSelfieWithCnhImage(
  selfieDataUrl: string,
  cnhImageDataUrl: string
): Promise<FaceComparisonResult> {
  await ensureFaceModelsLoaded();
  const faceapi = window.faceapi;

  const [selfieImg, cnhImg] = await Promise.all([
    loadHtmlImage(selfieDataUrl),
    loadHtmlImage(cnhImageDataUrl),
  ]);

  const detectorOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 512,
    scoreThreshold: 0.35,
  });

  const selfieDetection = await faceapi
    .detectSingleFace(selfieImg, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!selfieDetection) {
    return {
      matched: false,
      similarityPercent: 0,
      distance: 1,
      message: 'Nenhum rosto detectado na selfie. Posicione seu rosto na armação oval com boa iluminação.',
    };
  }

  // Na CNH pode haver o rosto principal e/ou marca d'água; pega a face com maior confiança/área
  const cnhDetections = await faceapi
    .detectAllFaces(cnhImg, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!cnhDetections || cnhDetections.length === 0) {
    return {
      matched: false,
      similarityPercent: 0,
      distance: 1,
      message: 'Não foi possível localizar o rosto no PDF da CNH. Verifique se o PDF é o oficial da CNH Digital.',
    };
  }

  let bestDistance = 1;
  for (const det of cnhDetections) {
    const dist = faceapi.euclideanDistance(selfieDetection.descriptor, det.descriptor);
    if (dist < bestDistance) {
      bestDistance = dist;
    }
  }

  const similarityPercent = Math.max(0, Math.min(100, Math.round((1 - bestDistance) * 100)));
  const matched = similarityPercent >= 50;

  return {
    matched,
    similarityPercent,
    distance: Number(bestDistance.toFixed(4)),
    message: matched
      ? `Identidade facial confirmada (${similarityPercent}% de compatibilidade com a CNH).`
      : `Compatibilidade de ${similarityPercent}% (mínimo exigido: 50%). Tire a foto novamente com boa iluminação frontal.`,
  };
}

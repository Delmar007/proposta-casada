import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export interface UserProfileRecord {
  userId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  cpf: string;
  rg: string;
  cnhNumber: string;
  birthDate: string;
  cnhFileName?: string;
  cnhImageDataUrl?: string;
  selfieImageDataUrl?: string;
  faceVerified: boolean;
  faceMatchScore?: number;
  updatedAt: string;
}

const memoryProfiles = new Map<string, UserProfileRecord>();
const LOCAL_DB_PATH = path.join(process.cwd(), '.data', 'user-profiles.json');

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function readLocalStore(): Record<string, UserProfileRecord> {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) return {};
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, UserProfileRecord>;
  } catch {
    return {};
  }
}

function writeLocalStore(data: Record<string, UserProfileRecord>): void {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Em ambientes serverless read-only (ex.: Vercel sem tabela Supabase ainda), mantém em memória
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileRecord | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          userId: data.user_id,
          fullName: data.full_name ?? '',
          email: data.email ?? '',
          whatsapp: data.whatsapp ?? '',
          cpf: data.cpf ?? '',
          rg: data.rg ?? '',
          cnhNumber: data.cnh_number ?? '',
          birthDate: data.birth_date ?? '',
          cnhFileName: data.cnh_file_name ?? undefined,
          cnhImageDataUrl: data.cnh_image_data_url ?? undefined,
          selfieImageDataUrl: data.selfie_image_data_url ?? undefined,
          faceVerified: Boolean(data.face_verified),
          faceMatchScore:
            typeof data.face_match_score === 'number' ? data.face_match_score : undefined,
          updatedAt: data.updated_at ?? new Date().toISOString(),
        };
      }
    } catch {
      // fallback abaixo
    }
  }

  const fromMemory = memoryProfiles.get(userId);
  if (fromMemory) return fromMemory;

  const local = readLocalStore();
  return local[userId] ?? null;
}

export async function saveUserProfile(
  profile: Omit<UserProfileRecord, 'updatedAt'>
): Promise<{ record: UserProfileRecord; storage: 'supabase' | 'local' }> {
  const record: UserProfileRecord = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  memoryProfiles.set(record.userId, record);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('user_profiles').upsert(
        {
          user_id: record.userId,
          full_name: record.fullName,
          email: record.email,
          whatsapp: record.whatsapp,
          cpf: record.cpf,
          rg: record.rg,
          cnh_number: record.cnhNumber,
          birth_date: record.birthDate,
          cnh_file_name: record.cnhFileName ?? null,
          cnh_image_data_url: record.cnhImageDataUrl ?? null,
          selfie_image_data_url: record.selfieImageDataUrl ?? null,
          face_verified: record.faceVerified,
          face_match_score: record.faceMatchScore ?? null,
          updated_at: record.updatedAt,
        },
        { onConflict: 'user_id' }
      );
      if (!error) {
        return { record, storage: 'supabase' };
      }
    } catch {
      // fallback local abaixo
    }
  }

  const local = readLocalStore();
  local[record.userId] = record;
  writeLocalStore(local);
  return { record, storage: 'local' };
}

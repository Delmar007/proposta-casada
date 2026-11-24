import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/persistence/profile-store';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
  if (!userId) {
    return NextResponse.json({ error: 'Usuário não identificado.' }, { status: 400 });
  }
  const profile = await getUserProfile(userId);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || '';
    const body = await req.json();
    const resolvedUserId = String(body.userId || userId || '').trim();
    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Usuário não identificado.' }, { status: 400 });
    }

    const fullName = String(body.fullName ?? '').trim();
    const email = String(body.email ?? '').trim();
    const whatsapp = String(body.whatsapp ?? '').trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Nome completo e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    if (whatsapp.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'Informe um número de telefone (WhatsApp) válido com DDD.' },
        { status: 400 }
      );
    }

    const { record, storage } = await saveUserProfile({
      userId: resolvedUserId,
      fullName,
      email,
      whatsapp,
      cpf: String(body.cpf ?? '').trim(),
      rg: String(body.rg ?? '').trim(),
      cnhNumber: String(body.cnhNumber ?? '').trim(),
      birthDate: String(body.birthDate ?? '').trim(),
      cnhFileName: body.cnhFileName ? String(body.cnhFileName) : undefined,
      cnhImageDataUrl: body.cnhImageDataUrl ? String(body.cnhImageDataUrl) : undefined,
      selfieImageDataUrl: body.selfieImageDataUrl ? String(body.selfieImageDataUrl) : undefined,
      faceVerified: Boolean(body.faceVerified),
      faceMatchScore:
        typeof body.faceMatchScore === 'number' ? body.faceMatchScore : undefined,
    });

    return NextResponse.json({ profile: record, storage });
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível salvar os dados do perfil.' },
      { status: 500 }
    );
  }
}

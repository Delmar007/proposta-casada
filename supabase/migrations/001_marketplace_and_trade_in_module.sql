-- ============================================================================
-- MÓDULO ADICIONAL — PERMUTA, PROPOSTAS COMPOSTAS E NEGOCIAÇÃO PROTEGIDA
-- Migration: 001_marketplace_and_trade_in_module.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. CORE MARKETPLACE TABLES (Preserving & extending marketplace base)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  residential_address TEXT,
  social_media TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'senior_moderator', 'admin')),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT NOT NULL,
  manufacture_year INTEGER NOT NULL,
  model_year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  fuel TEXT NOT NULL,
  transmission TEXT NOT NULL,
  color TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  fipe_price NUMERIC(12,2) NOT NULL,
  asking_price NUMERIC(12,2) NOT NULL,
  -- Confidential minimum price: NEVER exposed to buyers or public queries
  min_confidential_price NUMERIC(12,2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'negotiation_locked', 'sold', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public-safe view of vehicles that NEVER leaks min_confidential_price or seller PII
CREATE OR REPLACE VIEW public.vehicles_public AS
SELECT
  v.id,
  v.brand,
  v.model,
  v.version,
  v.manufacture_year,
  v.model_year,
  v.mileage,
  v.fuel,
  v.transmission,
  v.color,
  v.city,
  v.state,
  v.fipe_price,
  v.asking_price,
  v.description,
  v.status,
  v.created_at
FROM public.vehicles v
WHERE v.status IN ('active', 'negotiation_locked');

CREATE TABLE IF NOT EXISTS public.negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Unique per-negotiation anonymized aliases (e.g. 'Negociador 001', 'Proprietário 001')
  buyer_alias TEXT NOT NULL,
  seller_alias TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('cash_only', 'trade_in_plus_cash')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'counteroffer', 'accepted_pending_confirmation', 'ACORDO_CONFIRMADO', 'completed', 'cancelled', 'rejected')
  ),
  agreed_total_value NUMERIC(12,2),
  agreed_trade_in_value NUMERIC(12,2),
  agreed_cash_complement NUMERIC(12,2),
  buyer_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  seller_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  buyer_confirmed_at TIMESTAMPTZ,
  seller_confirmed_at TIMESTAMPTZ,
  contact_disclosure_authorized_buyer BOOLEAN NOT NULL DEFAULT FALSE,
  contact_disclosure_authorized_seller BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT buyer_seller_distinct CHECK (buyer_id <> seller_id)
);

-- ----------------------------------------------------------------------------
-- 2. ADDITIONAL MODULE TABLES (Section 10 Specification)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trade_in_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT NOT NULL,
  manufacture_year INTEGER NOT NULL,
  model_year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  fuel TEXT NOT NULL,
  transmission TEXT NOT NULL,
  color TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  declared_value NUMERIC(12,2) NOT NULL CHECK (declared_value > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trade_in_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_vehicle_id UUID NOT NULL REFERENCES public.trade_in_vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 6),
  moderation_status TEXT NOT NULL DEFAULT 'aguardando_moderacao' CHECK (
    moderation_status IN ('rascunho', 'aguardando_moderacao', 'em_analise', 'aprovada', 'rejeitada')
  ),
  exif_stripped BOOLEAN NOT NULL DEFAULT TRUE,
  privacy_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trade_in_vehicle_id, display_order)
);

CREATE TABLE IF NOT EXISTS public.trade_in_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  trade_in_vehicle_id UUID REFERENCES public.trade_in_vehicles(id) ON DELETE SET NULL,
  cash_complement NUMERIC(12,2) NOT NULL CHECK (cash_complement >= 0),
  total_offer_value NUMERIC(12,2) NOT NULL CHECK (total_offer_value > 0),
  status TEXT NOT NULL DEFAULT 'aguardando_moderacao' CHECK (
    status IN ('rascunho', 'aguardando_moderacao', 'em_analise', 'aprovada', 'rejeitada', 'encaminhada', 'visualizada', 'respondida', 'aceita')
  ),
  seller_eval_trade_in_value TEXT,
  seller_eval_condition TEXT,
  seller_eval_photos TEXT,
  seller_eval_cash TEXT,
  seller_eval_total TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.negotiation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  original_message TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'aguardando_moderacao' CHECK (
    moderation_status IN (
      'rascunho',
      'aguardando_moderacao',
      'em_analise',
      'aprovada',
      'rejeitada',
      'encaminhada',
      'visualizada',
      'respondida'
    )
  ),
  moderated_by UUID REFERENCES public.profiles(id),
  moderation_reason TEXT,
  pii_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  escalated_to_senior BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.negotiation_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.negotiation_messages(id) ON DELETE CASCADE,
  administrator_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (
    action IN ('approve', 'edit_and_approve', 'reject', 'request_correction', 'block_user', 'escalate_senior', 'view_identity')
  ),
  reason TEXT NOT NULL,
  previous_text TEXT,
  new_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.safe_meeting_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'estabelecimento_parceiro',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  approved BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.safe_meeting_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.safe_meeting_locations(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'vistoria_e_conferencia',
  vehicle_inspection BOOLEAN NOT NULL DEFAULT TRUE,
  document_check BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (
    status IN ('agendado', 'confirmado', 'concluido', 'cancelado')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.negotiation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  negotiation_id UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('message_approved', 'message_rejected', 'counteroffer_received', 'offer_accepted', 'negotiation_concluded', 'correction_requested')
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS FOR RLS & PERMISSIONS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('moderator', 'senior_moderator', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_negotiation_participant(neg_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.negotiations
    WHERE id = neg_id AND (buyer_id = uid OR seller_id = uid)
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_in_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_in_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_in_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_meeting_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_meeting_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users only see their own profile; authorized admins see profiles (audited)
CREATE POLICY "profiles_own_read" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Vehicles: seller sees own vehicle (incl. min_confidential_price); buyers use vehicles_public view
CREATE POLICY "vehicles_seller_or_admin" ON public.vehicles
  FOR SELECT USING (seller_id = auth.uid() OR public.is_admin_or_moderator(auth.uid()));

-- Negotiations: only participants and admins
CREATE POLICY "negotiations_participant_select" ON public.negotiations
  FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin_or_moderator(auth.uid())
  );

CREATE POLICY "negotiations_buyer_insert" ON public.negotiations
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = TRUE)
    AND NOT EXISTS (SELECT 1 FROM public.negotiations WHERE vehicle_id = negotiations.vehicle_id AND status = 'ACORDO_CONFIRMADO')
  );

-- Trade-in vehicles: only negotiation participants and admins
CREATE POLICY "trade_in_vehicles_select" ON public.trade_in_vehicles
  FOR SELECT USING (
    public.is_negotiation_participant(negotiation_id, auth.uid())
    OR public.is_admin_or_moderator(auth.uid())
  );

-- Trade-in images: sender/admin sees all; recipient ONLY sees approved images (never unapproved or originals)
CREATE POLICY "trade_in_images_select" ON public.trade_in_images
  FOR SELECT USING (
    public.is_admin_or_moderator(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.trade_in_vehicles tiv
      JOIN public.negotiations n ON n.id = tiv.negotiation_id
      WHERE tiv.id = trade_in_images.trade_in_vehicle_id
        AND (
          n.buyer_id = auth.uid()
          OR (n.seller_id = auth.uid() AND trade_in_images.moderation_status = 'aprovada')
        )
    )
  );

-- Trade-in offers: only negotiation participants and admins
CREATE POLICY "trade_in_offers_select" ON public.trade_in_offers
  FOR SELECT USING (
    public.is_negotiation_participant(negotiation_id, auth.uid())
    OR public.is_admin_or_moderator(auth.uid())
  );

-- Negotiation messages: CRITICAL RLS — pending/rejected messages CANNOT be queried by recipient!
CREATE POLICY "negotiation_messages_select" ON public.negotiation_messages
  FOR SELECT USING (
    public.is_admin_or_moderator(auth.uid())
    OR sender_id = auth.uid()
    OR (
      public.is_negotiation_participant(negotiation_id, auth.uid())
      AND moderation_status IN ('aprovada', 'encaminhada', 'visualizada', 'respondida')
    )
  );

CREATE POLICY "negotiation_messages_insert" ON public.negotiation_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND public.is_negotiation_participant(negotiation_id, auth.uid())
    AND moderation_status IN ('rascunho', 'aguardando_moderacao')
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = TRUE)
  );

-- Moderation logs: admins/moderators only
CREATE POLICY "moderation_logs_admin_only" ON public.negotiation_moderation_logs
  FOR ALL USING (public.is_admin_or_moderator(auth.uid()));

-- Safe meeting locations: active & approved locations readable by authenticated users
CREATE POLICY "safe_meeting_locations_read" ON public.safe_meeting_locations
  FOR SELECT USING (active = TRUE AND approved = TRUE);

-- Safe meeting appointments: negotiation participants and admins
CREATE POLICY "safe_meeting_appointments_select" ON public.safe_meeting_appointments
  FOR SELECT USING (
    public.is_negotiation_participant(negotiation_id, auth.uid())
    OR public.is_admin_or_moderator(auth.uid())
  );

-- Notifications: own user only
CREATE POLICY "notifications_own_only" ON public.negotiation_notifications
  FOR SELECT USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. SUPABASE STORAGE BUCKET & POLICIES FOR TRADE-IN PHOTOS
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-in-photos', 'trade-in-photos', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Originals folder: only uploader or admin
-- Sanitized folder: uploader, admin, or recipient AFTER image moderation_status = 'aprovada'
CREATE POLICY "trade_in_storage_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'trade-in-photos'
    AND (
      public.is_admin_or_moderator(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR (
        name LIKE 'sanitized/%'
        AND EXISTS (
          SELECT 1 FROM public.trade_in_images ti
          JOIN public.trade_in_vehicles tiv ON tiv.id = ti.trade_in_vehicle_id
          JOIN public.negotiations n ON n.id = tiv.negotiation_id
          WHERE ti.storage_path = name
            AND ti.moderation_status = 'aprovada'
            AND (n.buyer_id = auth.uid() OR n.seller_id = auth.uid())
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 6. BACKEND FUNCTIONS FOR MODERATION, FORWARDING & CLOSING
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_and_forward_message(
  p_message_id UUID,
  p_admin_id UUID,
  p_edited_text TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'Aprovada pela moderação'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_msg public.negotiation_messages%ROWTYPE;
  v_neg public.negotiations%ROWTYPE;
  v_recipient_id UUID;
  v_final_text TEXT;
  v_action TEXT;
BEGIN
  IF NOT public.is_admin_or_moderator(p_admin_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas moderadores autorizados podem aprovar mensagens.';
  END IF;

  SELECT * INTO v_msg FROM public.negotiation_messages WHERE id = p_message_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mensagem não encontrada.';
  END IF;

  SELECT * INTO v_neg FROM public.negotiations WHERE id = v_msg.negotiation_id;

  IF p_edited_text IS NOT NULL AND length(trim(p_edited_text)) > 0 AND p_edited_text <> v_msg.message_text THEN
    v_final_text := p_edited_text;
    v_action := 'edit_and_approve';
  ELSE
    v_final_text := v_msg.message_text;
    v_action := 'approve';
  END IF;

  UPDATE public.negotiation_messages
  SET
    message_text = v_final_text,
    moderation_status = 'encaminhada',
    moderated_by = p_admin_id,
    moderation_reason = p_reason,
    approved_at = NOW()
  WHERE id = p_message_id;

  -- Approve associated trade-in images if still pending
  UPDATE public.trade_in_images ti
  SET moderation_status = 'aprovada'
  FROM public.trade_in_vehicles tiv
  WHERE ti.trade_in_vehicle_id = tiv.id
    AND tiv.negotiation_id = v_msg.negotiation_id
    AND ti.moderation_status IN ('aguardando_moderacao', 'em_analise');

  INSERT INTO public.negotiation_moderation_logs (
    message_id, administrator_id, action, reason, previous_text, new_text
  ) VALUES (
    p_message_id, p_admin_id, v_action, p_reason, v_msg.original_message, v_final_text
  );

  v_recipient_id := CASE WHEN v_msg.sender_id = v_neg.buyer_id THEN v_neg.seller_id ELSE v_neg.buyer_id END;

  INSERT INTO public.negotiation_notifications (user_id, negotiation_id, event_type, title, body)
  VALUES (
    v_msg.sender_id, v_neg.id, 'message_approved',
    'Mensagem aprovada pela moderação',
    'Sua mensagem na negociação ' || v_neg.code || ' foi aprovada e encaminhada.'
  );

  INSERT INTO public.negotiation_notifications (user_id, negotiation_id, event_type, title, body)
  VALUES (
    v_recipient_id, v_neg.id, 'counteroffer_received',
    'Nova mensagem recebida',
    'Você recebeu uma nova mensagem moderada na negociação ' || v_neg.code || '.'
  );

  RETURN jsonb_build_object('status', 'encaminhada', 'message_id', p_message_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_message(
  p_message_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_msg public.negotiation_messages%ROWTYPE;
  v_neg public.negotiations%ROWTYPE;
BEGIN
  IF NOT public.is_admin_or_moderator(p_admin_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas moderadores autorizados podem rejeitar mensagens.';
  END IF;

  SELECT * INTO v_msg FROM public.negotiation_messages WHERE id = p_message_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mensagem não encontrada.';
  END IF;

  SELECT * INTO v_neg FROM public.negotiations WHERE id = v_msg.negotiation_id;

  UPDATE public.negotiation_messages
  SET
    moderation_status = 'rejeitada',
    moderated_by = p_admin_id,
    moderation_reason = p_reason
  WHERE id = p_message_id;

  INSERT INTO public.negotiation_moderation_logs (
    message_id, administrator_id, action, reason, previous_text
  ) VALUES (
    p_message_id, p_admin_id, 'reject', p_reason, v_msg.original_message
  );

  INSERT INTO public.negotiation_notifications (user_id, negotiation_id, event_type, title, body)
  VALUES (
    v_msg.sender_id, v_neg.id, 'message_rejected',
    'Mensagem rejeitada pela moderação',
    'Motivo: ' || p_reason
  );

  RETURN jsonb_build_object('status', 'rejeitada', 'message_id', p_message_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_negotiation_agreement(
  p_negotiation_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_neg public.negotiations%ROWTYPE;
BEGIN
  SELECT * INTO v_neg FROM public.negotiations WHERE id = p_negotiation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Negociação não encontrada.';
  END IF;

  IF p_user_id <> v_neg.buyer_id AND p_user_id <> v_neg.seller_id THEN
    RAISE EXCEPTION 'Usuário não autorizado para confirmar esta negociação.';
  END IF;

  IF p_user_id = v_neg.buyer_id THEN
    UPDATE public.negotiations SET buyer_confirmed = TRUE, buyer_confirmed_at = NOW(), updated_at = NOW() WHERE id = p_negotiation_id;
  ELSE
    UPDATE public.negotiations SET seller_confirmed = TRUE, seller_confirmed_at = NOW(), updated_at = NOW() WHERE id = p_negotiation_id;
  END IF;

  SELECT * INTO v_neg FROM public.negotiations WHERE id = p_negotiation_id;

  IF v_neg.buyer_confirmed AND v_neg.seller_confirmed THEN
    UPDATE public.negotiations SET status = 'ACORDO_CONFIRMADO', updated_at = NOW() WHERE id = p_negotiation_id;
    UPDATE public.vehicles SET status = 'negotiation_locked' WHERE id = v_neg.vehicle_id;

    INSERT INTO public.negotiation_notifications (user_id, negotiation_id, event_type, title, body)
    VALUES
      (v_neg.buyer_id, v_neg.id, 'negotiation_concluded', 'Acordo Confirmado', 'Ambas as partes confirmaram o acordo. Agende o encontro seguro.'),
      (v_neg.seller_id, v_neg.id, 'negotiation_concluded', 'Acordo Confirmado', 'Ambas as partes confirmaram o acordo. Agende o encontro seguro.');
  END IF;

  RETURN jsonb_build_object(
    'negotiation_id', p_negotiation_id,
    'buyer_confirmed', v_neg.buyer_confirmed,
    'seller_confirmed', v_neg.seller_confirmed,
    'status', CASE WHEN v_neg.buyer_confirmed AND v_neg.seller_confirmed THEN 'ACORDO_CONFIRMADO' ELSE v_neg.status END
  );
END;
$$;

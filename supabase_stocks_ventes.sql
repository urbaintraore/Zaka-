-- =============================================================================
-- ZAKA+ SUPABASE POSTGRESQL SCHEMA & RLS POLICIES FOR STOCKS, VENTES & STAFF_ROLES
-- =============================================================================

-- Ensure isCaissier and isServeur exist in relationship_requests
ALTER TABLE public.relationship_requests ADD COLUMN IF NOT EXISTS "isCaissier" BOOLEAN DEFAULT false;
ALTER TABLE public.relationship_requests ADD COLUMN IF NOT EXISTS "isServeur" BOOLEAN DEFAULT false;

-- Ensure staff_roles table exists
CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'caissier',
    status TEXT NOT NULL DEFAULT 'acceptee',
    "createdAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- 1. STOCKS TABLE (établissement, nom, prix, quantité, stock_faible)
CREATE TABLE IF NOT EXISTS public.stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    quantity INTEGER NOT NULL DEFAULT 0,
    stock_faible BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. VENTES TABLE (établissement, caissier_id, articles_json, montant_total, date)
CREATE TABLE IF NOT EXISTS public.ventes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "cashierId" UUID REFERENCES public.users(id) ON DELETE SET NULL,
    "cashierName" TEXT NOT NULL DEFAULT 'Caissier',
    "serverName" TEXT,
    "tableNote" TEXT,
    "clientType" TEXT DEFAULT 'Ordinaire',
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of products sold: [{ stockId, name, quantity, unitPrice }]
    "subtotalBoissons" NUMERIC(10, 2),
    "subtotalCuisine" NUMERIC(10, 2),
    "totalAchat" NUMERIC(10, 2),
    "discountAmount" NUMERIC(10, 2) DEFAULT 0.0,
    "totalAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    "paidAmount" NUMERIC(10, 2),
    "changeAmount" NUMERIC(10, 2),
    "avoirAmount" NUMERIC(10, 2),
    "mobileMoneyCode" TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "serverName" TEXT;
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "tableNote" TEXT;
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "clientType" TEXT DEFAULT 'Ordinaire';
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "subtotalBoissons" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "subtotalCuisine" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "totalAchat" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "discountAmount" NUMERIC(10, 2) DEFAULT 0.0;
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "paidAmount" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "changeAmount" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "avoirAmount" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "mobileMoneyCode" TEXT;

-- =============================================================================
-- HELPER FUNCTIONS FOR SECURITY (RLS WITH STRICT ESTABLISHMENT ISOLATION)
-- =============================================================================

-- Checks if a user is the owner (Gérant) of the establishment
CREATE OR REPLACE FUNCTION public.is_establishment_owner(est_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.establishments
    WHERE id = est_id AND "ownerId" = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE establishment_id = est_id
      AND user_id = auth.uid()
      AND role = 'gerant'
      AND status IN ('acceptee', 'active')
  ) OR EXISTS (
    SELECT 1 FROM public.relationship_requests
    WHERE "establishmentId" = est_id
      AND (
        (type = 'gerant_invite' AND "targetId" = auth.uid())
        OR (type IS DISTINCT FROM 'gerant_invite' AND ("initiatorId" = auth.uid() OR "userId" = auth.uid()))
      )
      AND status = 'acceptee'
      AND "requestedRole" = 'gerant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checks if a user is a Caissier or Gérant assigned for the establishment
CREATE OR REPLACE FUNCTION public.is_establishment_cashier(est_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_establishment_owner(est_id)
  OR EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE establishment_id = est_id
      AND user_id = auth.uid()
      AND role IN ('caissier', 'gerant')
      AND status IN ('acceptee', 'active')
  ) OR EXISTS (
    SELECT 1 FROM public.relationship_requests
    WHERE "establishmentId" = est_id
      AND (
        (type = 'gerant_invite' AND "targetId" = auth.uid())
        OR (type IS DISTINCT FROM 'gerant_invite' AND ("initiatorId" = auth.uid() OR "userId" = auth.uid()))
      )
      AND status = 'acceptee'
      AND ("requestedRole" = 'caissier' OR "isCaissier" = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checks if a user is any accredited staff (Gérant, Caissier, Serveur, DJ) for the establishment
CREATE OR REPLACE FUNCTION public.is_establishment_staff(est_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_establishment_owner(est_id)
  OR EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE establishment_id = est_id
      AND user_id = auth.uid()
      AND role IN ('gerant', 'caissier', 'serveur', 'dj')
      AND status IN ('acceptee', 'active')
  ) OR EXISTS (
    SELECT 1 FROM public.relationship_requests
    WHERE "establishmentId" = est_id
      AND (
        (type = 'gerant_invite' AND "targetId" = auth.uid())
        OR (type IS DISTINCT FROM 'gerant_invite' AND ("initiatorId" = auth.uid() OR "userId" = auth.uid()))
      )
      AND status = 'acceptee'
      AND ("requestedRole" IN ('gerant', 'caissier', 'serveur', 'dj') OR "isCaissier" = true OR "isServeur" = true OR "isDJ" = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. STAFF_ROLES POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_roles_select_policy" ON public.staff_roles;
CREATE POLICY "staff_roles_select_policy" ON public.staff_roles
    FOR SELECT
    USING (
        public.is_establishment_owner(establishment_id)
        OR user_id = auth.uid()
        OR public.is_establishment_staff(establishment_id)
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "staff_roles_insert_policy" ON public.staff_roles;
CREATE POLICY "staff_roles_insert_policy" ON public.staff_roles
    FOR INSERT
    WITH CHECK (
        public.is_establishment_owner(establishment_id) 
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "staff_roles_update_policy" ON public.staff_roles;
CREATE POLICY "staff_roles_update_policy" ON public.staff_roles
    FOR UPDATE
    USING (
        public.is_establishment_owner(establishment_id) 
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "staff_roles_delete_policy" ON public.staff_roles;
CREATE POLICY "staff_roles_delete_policy" ON public.staff_roles
    FOR DELETE
    USING (
        public.is_establishment_owner(establishment_id) 
        OR public.is_admin()
    );

-- -----------------------------------------------------------------------------
-- 1. STOCKS POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- SELECT: Gérant, Caissier, Serveur of that specific establishment can view stocks
DROP POLICY IF EXISTS "stocks_select_policy" ON public.stocks;
CREATE POLICY "stocks_select_policy" ON public.stocks
    FOR SELECT
    USING (
        public.is_establishment_staff("establishmentId") 
        OR public.is_admin()
    );

-- INSERT: Only Gérant or Caissier of that specific establishment can insert new stock catalog items
DROP POLICY IF EXISTS "stocks_insert_policy" ON public.stocks;
CREATE POLICY "stocks_insert_policy" ON public.stocks
    FOR INSERT
    WITH CHECK (
        public.is_establishment_cashier("establishmentId") 
        OR public.is_admin()
    );

-- UPDATE: Gérant, Caissier, or Serveur of that specific establishment can update stock quantities during sale
DROP POLICY IF EXISTS "stocks_update_policy" ON public.stocks;
CREATE POLICY "stocks_update_policy" ON public.stocks
    FOR UPDATE
    USING (
        public.is_establishment_staff("establishmentId") 
        OR public.is_admin()
    );

-- DELETE: ONLY Gérant of that specific establishment or Admin can delete stock entries (Caissiers/Serveurs prohibited)
DROP POLICY IF EXISTS "stocks_delete_policy" ON public.stocks;
CREATE POLICY "stocks_delete_policy" ON public.stocks
    FOR DELETE
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_admin()
    );

-- -----------------------------------------------------------------------------
-- 2. VENTES POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;

-- SELECT: Gérant, Caissier, or Serveur of that specific establishment can view sales history
DROP POLICY IF EXISTS "ventes_select_policy" ON public.ventes;
CREATE POLICY "ventes_select_policy" ON public.ventes
    FOR SELECT
    USING (
        public.is_establishment_staff("establishmentId") 
        OR public.is_admin()
    );

-- INSERT: Gérant, Caissier, or Serveur of that specific establishment can register a sale
DROP POLICY IF EXISTS "ventes_insert_policy" ON public.ventes;
CREATE POLICY "ventes_insert_policy" ON public.ventes
    FOR INSERT
    WITH CHECK (
        public.is_establishment_staff("establishmentId") 
        OR public.is_admin()
    );

-- UPDATE: ONLY Gérant of that specific establishment or Admin can modify sales records (audit protection)
DROP POLICY IF EXISTS "ventes_update_policy" ON public.ventes;
CREATE POLICY "ventes_update_policy" ON public.ventes
    FOR UPDATE
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_admin()
    );

-- DELETE: ONLY Gérant of that specific establishment or Admin can delete sales records (immutable transaction log)
DROP POLICY IF EXISTS "ventes_delete_policy" ON public.ventes;
CREATE POLICY "ventes_delete_policy" ON public.ventes
    FOR DELETE
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_admin()
    );


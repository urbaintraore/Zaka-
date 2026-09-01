-- =============================================================================
-- ZAKA+ SUPABASE POSTGRESQL SCHEMA & RLS POLICIES FOR STOCKS & VENTES
-- =============================================================================

-- Ensure isCaissier exists in relationship_requests
ALTER TABLE public.relationship_requests ADD COLUMN IF NOT EXISTS "isCaissier" BOOLEAN DEFAULT false;

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
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of products sold: [{ stockId, name, quantity, unitPrice }]
    "totalAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- HELPER FUNCTIONS FOR SECURITY (RLS)
-- =============================================================================

-- Checks if a user is the owner (Gérant) of the establishment
CREATE OR REPLACE FUNCTION public.is_establishment_owner(est_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.establishments
    WHERE id = est_id AND "ownerId" = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checks if a user is a Cashier (Caissier) assigned/accepted for the establishment
CREATE OR REPLACE FUNCTION public.is_establishment_cashier(est_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.relationship_requests
    WHERE "establishmentId" = est_id
      AND (
        "initiatorId" = auth.uid() 
        OR "targetId" = auth.uid()
        OR "userId" = auth.uid()
      )
      AND status = 'acceptee'
      AND ("requestedRole" = 'caissier' OR "isCaissier" = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on stocks and ventes
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;

-- 1. STOCKS POLICIES
-- ONLY owner, assigned cashiers and administrators can select/read stocks
CREATE POLICY "stocks_select_policy" ON public.stocks
    FOR SELECT
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_establishment_cashier("establishmentId")
        OR public.is_admin()
    );

-- Owner, assigned cashiers and administrators can insert stocks
CREATE POLICY "stocks_insert_policy" ON public.stocks
    FOR INSERT
    WITH CHECK (
        public.is_establishment_owner("establishmentId") 
        OR public.is_establishment_cashier("establishmentId")
        OR public.is_admin()
    );

-- Owner, assigned cashiers and administrators can update stocks
CREATE POLICY "stocks_update_policy" ON public.stocks
    FOR UPDATE
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_establishment_cashier("establishmentId")
        OR public.is_admin()
    );

-- ONLY owner and administrators can delete stock entries
CREATE POLICY "stocks_delete_policy" ON public.stocks
    FOR DELETE
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_admin()
    );

-- 2. VENTES POLICIES
-- ONLY owner, assigned cashiers and administrators can read sales history
CREATE POLICY "ventes_select_policy" ON public.ventes
    FOR SELECT
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_establishment_cashier("establishmentId")
        OR public.is_admin()
    );

-- Owner, assigned cashiers and administrators can register a sale
CREATE POLICY "ventes_insert_policy" ON public.ventes
    FOR INSERT
    WITH CHECK (
        public.is_establishment_owner("establishmentId") 
        OR public.is_establishment_cashier("establishmentId")
        OR public.is_admin()
    );

-- Owner and administrators can edit a sale record
CREATE POLICY "ventes_update_policy" ON public.ventes
    FOR UPDATE
    USING (
        public.is_establishment_owner("establishmentId") 
        OR public.is_admin()
    );

-- ONLY administrators can delete a sale record (immutable audit trail)
CREATE POLICY "ventes_delete_policy" ON public.ventes
    FOR DELETE
    USING (
        public.is_admin()
    );

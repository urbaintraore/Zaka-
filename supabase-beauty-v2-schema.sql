-- =============================================================================
-- ZAKA BEAUTY V2: CAISSE, STOCK, FIDÉLITÉ, STATISTIQUES & MULTI-TENANT RLS
-- =============================================================================

-- 1. Helper function for salon ownership verification
CREATE OR REPLACE FUNCTION public.is_beauty_salon_owner(p_salon_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.beauty_salons s
        WHERE s.id = p_salon_id 
          AND s.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 2. BEAUTY PRODUCTS TABLE (Stock Catalogue)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL DEFAULT 'soins',
    sku TEXT,
    unite TEXT NOT NULL DEFAULT 'unité',
    quantite_actuelle INTEGER NOT NULL DEFAULT 0,
    quantite_minimale INTEGER NOT NULL DEFAULT 2,
    prix_achat NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    prix_vente NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    fournisseur TEXT,
    image_url TEXT,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_products_salon ON public.beauty_products(salon_id);
CREATE INDEX IF NOT EXISTS idx_beauty_products_cat ON public.beauty_products(categorie);
CREATE INDEX IF NOT EXISTS idx_beauty_products_actif ON public.beauty_products(salon_id, actif);

ALTER TABLE public.beauty_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_products_select_owner_or_public"
    ON public.beauty_products FOR SELECT
    USING (public.is_beauty_salon_owner(salon_id) OR actif = true);

CREATE POLICY "beauty_products_insert_owner"
    ON public.beauty_products FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_products_update_owner"
    ON public.beauty_products FOR UPDATE
    USING (public.is_beauty_salon_owner(salon_id))
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_products_delete_owner"
    ON public.beauty_products FOR DELETE
    USING (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 3. BEAUTY STOCK MOVEMENTS (Mouvements de stock immuables)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.beauty_products(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL, -- Valeur positive
    type_mouvement TEXT NOT NULL, -- 'entree', 'sortie', 'ajustement', 'vente', 'consommation', 'perte', 'retour'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    sale_id UUID,
    date_mouvement TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    commentaire TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_stock_mov_salon ON public.beauty_stock_movements(salon_id);
CREATE INDEX IF NOT EXISTS idx_beauty_stock_mov_prod ON public.beauty_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_beauty_stock_mov_date ON public.beauty_stock_movements(salon_id, date_mouvement);

ALTER TABLE public.beauty_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_stock_movements_select_owner"
    ON public.beauty_stock_movements FOR SELECT
    USING (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_stock_movements_insert_owner"
    ON public.beauty_stock_movements FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 4. BEAUTY INVENTORY SESSIONS (Inventaires physiques)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_inventory_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    date_inventaire DATE NOT NULL DEFAULT CURRENT_DATE,
    realise_par_nom TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    commentaire TEXT,
    total_ecart_valeur_fcfa NUMERIC(10, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_inv_salon ON public.beauty_inventory_sessions(salon_id);

ALTER TABLE public.beauty_inventory_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_inv_select_owner"
    ON public.beauty_inventory_sessions FOR SELECT
    USING (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_inv_insert_owner"
    ON public.beauty_inventory_sessions FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 5. BEAUTY SALES TABLE (Caisse & Ventes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.beauty_appointments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nom_client TEXT NOT NULL DEFAULT 'Client de passage',
    telephone_client TEXT,
    employee_id UUID,
    employee_name TEXT,
    montant_brut_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    montant_remise_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    montant_total_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    montant_recu_fcfa NUMERIC(10, 2),
    montant_rendu_fcfa NUMERIC(10, 2),
    moyen_paiement TEXT NOT NULL DEFAULT 'especes', -- 'especes', 'orange_money', 'moov_money', 'wave', 'virement', 'autre'
    reference_paiement TEXT,
    statut TEXT NOT NULL DEFAULT 'paye', -- 'paye', 'annule', 'rembourse'
    date_vente TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    points_fidelite_gagnes INTEGER DEFAULT 0,
    points_fidelite_utilises INTEGER DEFAULT 0,
    recompense_id UUID,
    notes TEXT,
    caissier_nom TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_sales_salon ON public.beauty_sales(salon_id);
CREATE INDEX IF NOT EXISTS idx_beauty_sales_client ON public.beauty_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_beauty_sales_date ON public.beauty_sales(salon_id, date_vente);
CREATE INDEX IF NOT EXISTS idx_beauty_sales_statut ON public.beauty_sales(salon_id, statut);

ALTER TABLE public.beauty_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_sales_select_owner_or_client"
    ON public.beauty_sales FOR SELECT
    USING (
        public.is_beauty_salon_owner(salon_id) OR
        (auth.uid() IS NOT NULL AND auth.uid() = client_id)
    );

CREATE POLICY "beauty_sales_insert_owner"
    ON public.beauty_sales FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_sales_update_owner"
    ON public.beauty_sales FOR UPDATE
    USING (public.is_beauty_salon_owner(salon_id))
    WITH CHECK (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 6. BEAUTY SALE ITEMS TABLE (Lignes de vente : services & produits)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.beauty_sales(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'service', 'produit'
    item_id UUID NOT NULL,
    nom TEXT NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    montant_total_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_sale_items_sale ON public.beauty_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_beauty_sale_items_item ON public.beauty_sale_items(item_id, item_type);

ALTER TABLE public.beauty_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_sale_items_select"
    ON public.beauty_sale_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.beauty_sales s
            WHERE s.id = beauty_sale_items.sale_id
              AND (public.is_beauty_salon_owner(s.salon_id) OR (auth.uid() IS NOT NULL AND auth.uid() = s.client_id))
        )
    );

CREATE POLICY "beauty_sale_items_insert"
    ON public.beauty_sale_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.beauty_sales s
            WHERE s.id = beauty_sale_items.sale_id
              AND public.is_beauty_salon_owner(s.salon_id)
        )
    );


-- -----------------------------------------------------------------------------
-- 7. BEAUTY CASH CLOSURES TABLE (Clôtures de caisse journalières)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_cash_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    date_cloture DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_cloture TIME NOT NULL DEFAULT CURRENT_TIME,
    caissier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    caissier_nom TEXT NOT NULL DEFAULT 'Gérant',
    fond_de_caisse_initial_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_ventes_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_especes_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_orange_money_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_moov_money_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_wave_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_virement_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_autre_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    nombre_transactions INTEGER NOT NULL DEFAULT 0,
    total_reel_constate_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    ecart_caisse_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    notes TEXT,
    statut TEXT NOT NULL DEFAULT 'cloturee',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_beauty_closure_salon_date ON public.beauty_cash_closures(salon_id, date_cloture);

ALTER TABLE public.beauty_cash_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_closures_select_owner"
    ON public.beauty_cash_closures FOR SELECT
    USING (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_closures_insert_owner"
    ON public.beauty_cash_closures FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 8. BEAUTY LOYALTY SETTINGS TABLE (Paramètres Fidélité « ZAKA Beauty Rewards »)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL UNIQUE REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    actif BOOLEAN NOT NULL DEFAULT true,
    montant_step_fcfa NUMERIC(10, 2) NOT NULL DEFAULT 1000.0, -- e.g. 1000 FCFA
    points_gagnes_par_step INTEGER NOT NULL DEFAULT 10,       -- e.g. 10 points
    expiration_mois INTEGER DEFAULT 12,
    niveau_bronze_min_points INTEGER DEFAULT 0,
    niveau_argent_min_points INTEGER DEFAULT 200,
    niveau_or_min_points INTEGER DEFAULT 500,
    niveau_platine_min_points INTEGER DEFAULT 1000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.beauty_loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_loyalty_settings_select_public"
    ON public.beauty_loyalty_settings FOR SELECT
    USING (true);

CREATE POLICY "beauty_loyalty_settings_insert_owner"
    ON public.beauty_loyalty_settings FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_loyalty_settings_update_owner"
    ON public.beauty_loyalty_settings FOR UPDATE
    USING (public.is_beauty_salon_owner(salon_id))
    WITH CHECK (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 9. BEAUTY LOYALTY ACCOUNTS TABLE (Comptes Fidélité Clients par Salon)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nom_client TEXT NOT NULL,
    telephone_client TEXT NOT NULL,
    points_solde INTEGER NOT NULL DEFAULT 0,
    points_cumules_total INTEGER NOT NULL DEFAULT 0,
    points_utilises_total INTEGER NOT NULL DEFAULT 0,
    niveau TEXT NOT NULL DEFAULT 'bronze', -- 'bronze', 'argent', 'or', 'platine', 'diamant'
    dernier_achat_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_beauty_loyalty_acc_unique ON public.beauty_loyalty_accounts(salon_id, telephone_client);
CREATE INDEX IF NOT EXISTS idx_beauty_loyalty_acc_client ON public.beauty_loyalty_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_beauty_loyalty_acc_salon ON public.beauty_loyalty_accounts(salon_id);

ALTER TABLE public.beauty_loyalty_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_loyalty_acc_select_owner_or_client"
    ON public.beauty_loyalty_accounts FOR SELECT
    USING (
        public.is_beauty_salon_owner(salon_id) OR
        (auth.uid() IS NOT NULL AND auth.uid() = client_id)
    );

CREATE POLICY "beauty_loyalty_acc_insert_owner"
    ON public.beauty_loyalty_accounts FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_loyalty_acc_update_owner"
    ON public.beauty_loyalty_accounts FOR UPDATE
    USING (public.is_beauty_salon_owner(salon_id))
    WITH CHECK (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 10. BEAUTY REWARDS TABLE (Catalogue des Récompenses)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    description TEXT,
    points_requis INTEGER NOT NULL DEFAULT 100,
    type_recompense TEXT NOT NULL DEFAULT 'reduction_pourcentage', -- 'reduction_pourcentage', 'reduction_montant', 'service_gratuit', 'produit_offert', 'cadeau'
    valeur_reduction NUMERIC(10, 2),
    service_id UUID REFERENCES public.beauty_services(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.beauty_products(id) ON DELETE SET NULL,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_rewards_salon ON public.beauty_rewards(salon_id);

ALTER TABLE public.beauty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_rewards_select_public"
    ON public.beauty_rewards FOR SELECT
    USING (true);

CREATE POLICY "beauty_rewards_insert_owner"
    ON public.beauty_rewards FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_rewards_update_owner"
    ON public.beauty_rewards FOR UPDATE
    USING (public.is_beauty_salon_owner(salon_id))
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_rewards_delete_owner"
    ON public.beauty_rewards FOR DELETE
    USING (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 11. BEAUTY LOYALTY TRANSACTIONS TABLE (Historique Immuable des Points)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.beauty_loyalty_accounts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nom_client TEXT,
    telephone_client TEXT,
    sale_id UUID REFERENCES public.beauty_sales(id) ON DELETE SET NULL,
    reward_id UUID REFERENCES public.beauty_rewards(id) ON DELETE SET NULL,
    reward_titre TEXT,
    type_transaction TEXT NOT NULL, -- 'gain', 'utilisation', 'ajustement', 'expiration'
    points INTEGER NOT NULL,
    solde_apres INTEGER NOT NULL DEFAULT 0,
    motif TEXT,
    date_transaction TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_loyalty_tx_acc ON public.beauty_loyalty_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_beauty_loyalty_tx_salon ON public.beauty_loyalty_transactions(salon_id);
CREATE INDEX IF NOT EXISTS idx_beauty_loyalty_tx_client ON public.beauty_loyalty_transactions(client_id);

ALTER TABLE public.beauty_loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_loyalty_tx_select_owner_or_client"
    ON public.beauty_loyalty_transactions FOR SELECT
    USING (
        public.is_beauty_salon_owner(salon_id) OR
        (auth.uid() IS NOT NULL AND auth.uid() = client_id)
    );

CREATE POLICY "beauty_loyalty_tx_insert_owner"
    ON public.beauty_loyalty_transactions FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));


-- -----------------------------------------------------------------------------
-- 12. BEAUTY STAFF MEMBERS TABLE (Équipe & Professionnels du Salon)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nom TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'coiffeur', -- 'coiffeur', 'estheticienne', 'barbier', 'manucure', 'caissier', 'gerant', 'apprenti'
    telephone TEXT,
    specialites TEXT[] DEFAULT '{}',
    actif BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_beauty_staff_salon ON public.beauty_staff_members(salon_id);

ALTER TABLE public.beauty_staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_staff_select_public"
    ON public.beauty_staff_members FOR SELECT
    USING (true);

CREATE POLICY "beauty_staff_insert_owner"
    ON public.beauty_staff_members FOR INSERT
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_staff_update_owner"
    ON public.beauty_staff_members FOR UPDATE
    USING (public.is_beauty_salon_owner(salon_id))
    WITH CHECK (public.is_beauty_salon_owner(salon_id));

CREATE POLICY "beauty_staff_delete_owner"
    ON public.beauty_staff_members FOR DELETE
    USING (public.is_beauty_salon_owner(salon_id));

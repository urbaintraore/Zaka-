-- =============================================================================
-- ZAKA+ SECURITY HARDENING SQL SCRIPT
-- =============================================================================

-- 1. PROTECT USER ROLES FROM SELF-ELEVATION VIA FRONTEND UPDATES
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an admin, prevent changing role, status, or validation status
  IF NOT public.is_admin() THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) OR 
       (NEW.status IS DISTINCT FROM OLD.status) OR 
       (NEW.is_validated IS DISTINCT FROM OLD.is_validated) THEN
      RAISE EXCEPTION 'Action non autorisée : Vous ne pouvez pas modifier votre rôle ou statut de validation.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_self_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 2. RESTRICT STOCK CATALOG CREATION & DELETION TO ESTABLISHMENT OWNERS ONLY
DROP POLICY IF EXISTS "stocks_insert_policy" ON public.stocks;
CREATE POLICY "stocks_insert_policy" ON public.stocks FOR INSERT WITH CHECK (
  public.is_establishment_owner("establishmentId") OR public.is_admin()
);

DROP POLICY IF EXISTS "stocks_delete_policy" ON public.stocks;
CREATE POLICY "stocks_delete_policy" ON public.stocks FOR DELETE USING (
  public.is_establishment_owner("establishmentId") OR public.is_admin()
);

-- 3. RESTRICT SALES & ACCOUNTING VISIBILITY
-- Cashiers can only view their own sales; Gerants can view all establishment sales.
DROP POLICY IF EXISTS "ventes_select_policy" ON public.ventes;
CREATE POLICY "ventes_select_policy" ON public.ventes FOR SELECT USING (
  public.is_establishment_owner("establishmentId") OR 
  ("cashierId" = auth.uid()) OR 
  public.is_admin()
);

-- 4. ATOMIC & SECURE SALE TRANSACTION RPC (PREVENTS PRICE MANIPULATION & RACE CONDITIONS)
CREATE OR REPLACE FUNCTION public.enregistrer_vente_securisee(
  p_establishment_id UUID,
  p_items JSONB,
  p_cashier_id UUID,
  p_payment_method TEXT DEFAULT 'cash'
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_stock_id UUID;
  v_quantity INT;
  v_real_price NUMERIC;
  v_item_total NUMERIC;
  v_total_amount NUMERIC := 0;
  v_current_stock INT;
  v_processed_items JSONB := '[]'::JSONB;
  v_sale_id UUID;
BEGIN
  -- Verify caller is authorized cashier or owner
  IF NOT (public.is_establishment_cashier(p_establishment_id) OR public.is_establishment_owner(p_establishment_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Accès refusé : Vous ne faites pas partie du personnel autorisé.';
  END IF;

  -- Iterate through sale items to verify prices and check stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_stock_id := (v_item->>'id')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Quantité invalide pour l''article %', v_stock_id;
    END IF;

    -- Fetch real price and stock quantity from database with row lock
    SELECT quantity, price INTO v_current_stock, v_real_price
    FROM public.stocks
    WHERE id = v_stock_id AND "establishmentId" = p_establishment_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produit introuvable dans le stock de l''établissement.';
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Stock insuffisant (Disponible : %, Demandé : %)', v_current_stock, v_quantity;
    END IF;

    -- Calculate exact amount on server
    v_item_total := v_real_price * v_quantity;
    v_total_amount := v_total_amount + v_item_total;

    -- Atomic decrement stock
    UPDATE public.stocks
    SET quantity = quantity - v_quantity,
        "updatedAt" = NOW()
    WHERE id = v_stock_id;

    -- Build item summary
    v_processed_items := v_processed_items || jsonb_build_object(
      'id', v_stock_id,
      'name', v_item->>'name',
      'quantity', v_quantity,
      'unitPrice', v_real_price,
      'totalPrice', v_item_total
    );
  END LOOP;

  -- Record sale
  INSERT INTO public.ventes (
    "establishmentId",
    "cashierId",
    "totalAmount",
    "paymentMethod",
    items,
    "createdAt"
  )
  VALUES (
    p_establishment_id,
    p_cashier_id,
    v_total_amount,
    p_payment_method,
    v_processed_items,
    NOW()
  )
  RETURNING id INTO v_sale_id;

  RETURN jsonb_build_object(
    'success', true,
    'saleId', v_sale_id,
    'totalAmount', v_total_amount,
    'message', 'Vente enregistrée avec succès.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ANTI SELF-REFERRAL SECURITY TRIGGER
CREATE OR REPLACE FUNCTION public.check_parrainage_validity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."godfatherId" = NEW."godsonId" THEN
    RAISE EXCEPTION 'Auto-parrainage interdit.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.parrainages WHERE "godsonId" = NEW."godsonId") THEN
    RAISE EXCEPTION 'Cet utilisateur a déjà été parrainé.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_parrainage ON public.parrainages;
CREATE TRIGGER trg_check_parrainage
  BEFORE INSERT ON public.parrainages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_parrainage_validity();

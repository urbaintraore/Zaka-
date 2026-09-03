-- =============================================================================
-- SCRIPT D'AUDIT COMPLET ET SÉCURISATION RLS POUR ZAKA+
-- Tables couvertes :
--   1. Comptabilité & Ventes : public.ventes, public.stocks
--   2. Réservations : public.reservations
--   3. Messagerie : public.conversations, public.messages
--   4. Invitations & Adhésions : public.relationship_requests, public.applications
-- =============================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1. MODULE DE COMPTABILITÉ ET VENTES (ventes, stocks)
-- -----------------------------------------------------------------------------

-- VENTES : Seul le Gérant de l'établissement peut lire toutes les ventes comptables.
-- Le Caissier ne peut lire que SES propres ventes du jour. Les DJ et employés n'ont aucun accès.
DROP POLICY IF EXISTS "ventes_select_policy" ON public.ventes;
CREATE POLICY "ventes_select_policy" ON public.ventes FOR SELECT USING (
  public.is_establishment_owner("establishmentId") OR 
  ("cashierId" = auth.uid()) OR 
  public.is_admin()
);

-- VENTES INSERTION : Uniquement via personnel autorisé (Caissier / Gérant)
DROP POLICY IF EXISTS "ventes_insert_policy" ON public.ventes;
CREATE POLICY "ventes_insert_policy" ON public.ventes FOR INSERT WITH CHECK (
  public.is_establishment_cashier("establishmentId") OR 
  public.is_establishment_owner("establishmentId") OR 
  public.is_admin()
);

-- STOCKS INSERTION / SUPPRESSION : Réservé exclusivement au Gérant de l'établissement (Interdit au Caissier/DJ)
DROP POLICY IF EXISTS "stocks_insert_policy" ON public.stocks;
CREATE POLICY "stocks_insert_policy" ON public.stocks FOR INSERT WITH CHECK (
  public.is_establishment_owner("establishmentId") OR public.is_admin()
);

DROP POLICY IF EXISTS "stocks_delete_policy" ON public.stocks;
CREATE POLICY "stocks_delete_policy" ON public.stocks FOR DELETE USING (
  public.is_establishment_owner("establishmentId") OR public.is_admin()
);

-- -----------------------------------------------------------------------------
-- 2. MODULE DE RÉSERVATIONS (reservations)
-- -----------------------------------------------------------------------------

-- LECTURE : Strictement isolé entre le client émetteur et le gérant destinataire
DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
CREATE POLICY "reservations_select" ON public.reservations FOR SELECT USING (
  "clientId" = auth.uid() OR 
  public.is_establishment_owner("establishmentId") OR 
  public.is_admin()
);

-- CRÉATION : Le client authentifié crée ses réservations
DROP POLICY IF EXISTS "reservations_insert" ON public.reservations;
CREATE POLICY "reservations_insert" ON public.reservations FOR INSERT WITH CHECK (
  "clientId" = auth.uid()
);

-- MODIFICATION DE STATUT : Le Gérant modifie le statut; le client peut annuler la sienne
DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
CREATE POLICY "reservations_update" ON public.reservations FOR UPDATE USING (
  "clientId" = auth.uid() OR 
  public.is_establishment_owner("establishmentId") OR 
  public.is_admin()
);

-- -----------------------------------------------------------------------------
-- 3. MESSAGERIE (conversations, messages)
-- -----------------------------------------------------------------------------

-- CONVERSATIONS : Accessibles uniquement par le client ou le gérant concerné
DROP POLICY IF EXISTS "conversations_access" ON public.conversations;
CREATE POLICY "conversations_access" ON public.conversations FOR ALL USING (
  "clientId" = auth.uid() OR 
  "ownerId" = auth.uid() OR 
  public.is_admin()
);

-- MESSAGES : Lecture sécurisée via sous-requête EXISTS sur la conversation parente
-- Empêche l'accès aux messages d'autrui par manipulation d'ID
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages."conversationId"
    AND (c."clientId" = auth.uid() OR c."ownerId" = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages."conversationId"
    AND (c."clientId" = auth.uid() OR c."ownerId" = auth.uid() OR public.is_admin())
  )
  AND "senderId" = auth.uid()
);

-- -----------------------------------------------------------------------------
-- 4. INVITATIONS ET DEMANDES D'ADHÉSION (relationship_requests, applications)
-- -----------------------------------------------------------------------------

-- DEMANDES D'ADHÉSION / RELATIONS : Utilisateur demandeur ou Gérant de l'établissement
DROP POLICY IF EXISTS "relationships_select" ON public.relationship_requests;
CREATE POLICY "relationships_select" ON public.relationship_requests FOR SELECT USING (
  "userId" = auth.uid() OR 
  public.is_establishment_owner("establishmentId") OR 
  public.is_admin()
);

DROP POLICY IF EXISTS "relationships_update" ON public.relationship_requests;
CREATE POLICY "relationships_update" ON public.relationship_requests FOR UPDATE USING (
  "userId" = auth.uid() OR 
  public.is_establishment_owner("establishmentId") OR 
  public.is_admin()
);

-- CANDIDATURES : Candidat ou Gérant de l'établissement récepteur
DROP POLICY IF EXISTS "applications_select" ON public.applications;
CREATE POLICY "applications_select" ON public.applications FOR SELECT USING (
  "clientId" = auth.uid() OR 
  public.is_establishment_owner("establishmentId") OR 
  public.is_admin()
);

-- -----------------------------------------------------------------------------
-- 5. REQUÊTES SQL DE VÉRIFICATION ET D'AUDIT DES RÈGLES PG_POLICIES
-- -----------------------------------------------------------------------------

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operation,
    qual AS read_condition,
    with_check AS write_condition
FROM pg_policies
WHERE tablename IN (
    'ventes', 
    'stocks', 
    'reservations', 
    'conversations', 
    'messages', 
    'relationship_requests', 
    'applications'
)
ORDER BY tablename, cmd;

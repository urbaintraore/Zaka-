-- =============================================================================
-- ÉTAPE 3 SUR 3 : Candidatures, Messagerie, Amis, Entreprises & Publicités
-- =============================================================================

-- Applications (Candidatures) & RH
CREATE POLICY "applications_select" ON public.applications FOR SELECT USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "applications_insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "applications_update" ON public.applications FOR UPDATE USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

CREATE POLICY "relationships_select" ON public.relationship_requests FOR SELECT USING ("userId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "relationships_insert" ON public.relationship_requests FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "relationships_update" ON public.relationship_requests FOR UPDATE USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

-- Messagerie & Amis
CREATE POLICY "conversations_access" ON public.conversations FOR ALL USING ("clientId" = auth.uid() OR "ownerId" = auth.uid() OR public.is_admin());

CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages."conversationId" AND (c."clientId" = auth.uid() OR c."ownerId" = auth.uid() OR public.is_admin()))
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = "senderId" AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages."conversationId" AND (c."clientId" = auth.uid() OR c."ownerId" = auth.uid()))
);

CREATE POLICY "friendships_access" ON public.friendships FOR ALL USING ("requesterId" = auth.uid() OR "receiverId" = auth.uid() OR public.is_admin());

-- Entreprises & Campagnes Publicitaires
CREATE POLICY "entreprises_select" ON public.entreprises FOR SELECT USING (true);
CREATE POLICY "entreprises_write" ON public.entreprises FOR ALL USING ("ownerId" = auth.uid() OR public.is_admin());

CREATE POLICY "campaigns_access" ON public.ad_campaigns FOR ALL USING ("advertiserId" = auth.uid() OR public.is_admin());
CREATE POLICY "payments_access" ON public.payments FOR ALL USING ("advertiserId" = auth.uid() OR public.is_admin());
CREATE POLICY "invoices_access" ON public.invoices FOR ALL USING ("advertiserId" = auth.uid() OR public.is_admin());

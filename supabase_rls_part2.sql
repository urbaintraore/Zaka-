-- =============================================================================
-- ÉTAPE 2 SUR 3 : Politiques Utilisateurs, Établissements, Avis & Réservations
-- =============================================================================

-- Users
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Establishments
CREATE POLICY "establishments_select_all" ON public.establishments FOR SELECT USING (status = 'valide' OR "ownerId" = auth.uid() OR public.is_admin());
CREATE POLICY "establishments_insert_owner" ON public.establishments FOR INSERT WITH CHECK (auth.uid() = "ownerId" OR public.is_admin());
CREATE POLICY "establishments_update_owner" ON public.establishments FOR UPDATE USING (auth.uid() = "ownerId" OR public.is_admin());
CREATE POLICY "establishments_delete_owner" ON public.establishments FOR DELETE USING (auth.uid() = "ownerId" OR public.is_admin());

-- Publications & Stories
CREATE POLICY "publications_select" ON public.publications FOR SELECT USING (true);
CREATE POLICY "publications_write" ON public.publications FOR ALL USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (true);
CREATE POLICY "stories_write" ON public.stories FOR ALL USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

-- Reviews
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (auth.uid() = "clientId" OR public.is_establishment_owner("establishmentId") OR public.is_admin());

-- Reservations & Commandes
CREATE POLICY "reservations_select" ON public.reservations FOR SELECT USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "reservations_insert" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "reservations_update" ON public.reservations FOR UPDATE USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());

CREATE POLICY "orders_select" ON public.takeaway_orders FOR SELECT USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "orders_insert" ON public.takeaway_orders FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "orders_update" ON public.takeaway_orders FOR UPDATE USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());

-- =============================================================================
-- ZAKA+ SUPABASE RLS POLICIES (Phase 4)
-- =============================================================================

-- Helpers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_establishment_owner(est_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.establishments
    WHERE id = est_id AND "ownerId" = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carnet_entrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeaway_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_ambiance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists_dj ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zaka_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parrainages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_outings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_statistics ENABLE ROW LEVEL SECURITY;

-- 1. Users Policies
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. Establishments Policies
CREATE POLICY "establishments_select_all" ON public.establishments FOR SELECT USING (status = 'valide' OR "ownerId" = auth.uid() OR public.is_admin());
CREATE POLICY "establishments_insert_owner" ON public.establishments FOR INSERT WITH CHECK (auth.uid() = "ownerId" OR public.is_admin());
CREATE POLICY "establishments_update_owner" ON public.establishments FOR UPDATE USING (auth.uid() = "ownerId" OR public.is_admin());
CREATE POLICY "establishments_delete_owner" ON public.establishments FOR DELETE USING (auth.uid() = "ownerId" OR public.is_admin());

-- 3. Content Policies
CREATE POLICY "publications_select" ON public.publications FOR SELECT USING (true);
CREATE POLICY "publications_write" ON public.publications FOR ALL USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (true);
CREATE POLICY "stories_write" ON public.stories FOR ALL USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (auth.uid() = "clientId" OR public.is_establishment_owner("establishmentId") OR public.is_admin());

-- 4. Reservations & Orders
CREATE POLICY "reservations_select" ON public.reservations FOR SELECT USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "reservations_insert" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "reservations_update" ON public.reservations FOR UPDATE USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());

CREATE POLICY "orders_select" ON public.takeaway_orders FOR SELECT USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "orders_insert" ON public.takeaway_orders FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "orders_update" ON public.takeaway_orders FOR UPDATE USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());

-- 5. Applications & Staff
CREATE POLICY "applications_select" ON public.applications FOR SELECT USING ("clientId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "applications_insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = "clientId");
CREATE POLICY "applications_update" ON public.applications FOR UPDATE USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

CREATE POLICY "relationships_select" ON public.relationship_requests FOR SELECT USING ("userId" = auth.uid() OR public.is_establishment_owner("establishmentId") OR public.is_admin());
CREATE POLICY "relationships_insert" ON public.relationship_requests FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "relationships_update" ON public.relationship_requests FOR UPDATE USING (public.is_establishment_owner("establishmentId") OR public.is_admin());

-- 6. Messaging & Friends
CREATE POLICY "conversations_access" ON public.conversations FOR ALL USING ("clientId" = auth.uid() OR "ownerId" = auth.uid() OR public.is_admin());
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages."conversationId" AND (c."clientId" = auth.uid() OR c."ownerId" = auth.uid() OR public.is_admin()))
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = "senderId" AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages."conversationId" AND (c."clientId" = auth.uid() OR c."ownerId" = auth.uid()))
);

CREATE POLICY "friendships_access" ON public.friendships FOR ALL USING ("requesterId" = auth.uid() OR "receiverId" = auth.uid() OR public.is_admin());

-- 7. Ads & Companies
CREATE POLICY "entreprises_select" ON public.entreprises FOR SELECT USING (true);
CREATE POLICY "entreprises_write" ON public.entreprises FOR ALL USING ("ownerId" = auth.uid() OR public.is_admin());

CREATE POLICY "campaigns_access" ON public.ad_campaigns FOR ALL USING ("advertiserId" = auth.uid() OR public.is_admin());
CREATE POLICY "payments_access" ON public.payments FOR ALL USING ("advertiserId" = auth.uid() OR public.is_admin());
CREATE POLICY "invoices_access" ON public.invoices FOR ALL USING ("advertiserId" = auth.uid() OR public.is_admin());

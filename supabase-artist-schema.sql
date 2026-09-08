-- =========================================================================
-- ZAKA+ : SCHEMA SQL SUPABASE & POLITIQUES RLS POUR LES ARTISTES
-- =========================================================================

-- 1. Table des profils d'artistes
CREATE TABLE IF NOT EXISTS public.artist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_artiste TEXT NOT NULL,
    nom_complet TEXT,
    categorie_artistique TEXT NOT NULL DEFAULT 'Chanteur / Chanteuse',
    genres TEXT[] DEFAULT ARRAY['Afrobeat'],
    biographie TEXT,
    ville TEXT DEFAULT 'Ouagadougou',
    pays TEXT DEFAULT 'Burkina Faso',
    photo_profil TEXT,
    photo_couverture TEXT,
    whatsapp_pro TEXT,
    telephone_pro TEXT,
    reseaux_sociaux JSONB DEFAULT '{}'::jsonb,
    liens_musicaux JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT DEFAULT 'none', -- none, pending, verified, rejected
    followers_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_artist_user UNIQUE (user_id)
);

-- 2. Table des demandes de booking / prestations
CREATE TABLE IF NOT EXISTS public.artist_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requester_name TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT,
    location TEXT NOT NULL,
    budget TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, refused, completed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des publications d'artistes (actualités, affiches, etc.)
CREATE TABLE IF NOT EXISTS public.artist_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL,
    artist_photo TEXT,
    type TEXT DEFAULT 'annonce', -- annonce, evenement, affiche, musique, backstage
    title TEXT,
    content TEXT NOT NULL,
    media_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des stories éphémères (24h)
CREATE TABLE IF NOT EXISTS public.artist_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL,
    artist_photo TEXT,
    type TEXT DEFAULT 'photo', -- photo, video
    media_url TEXT NOT NULL,
    caption TEXT,
    views_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des relations artistes / établissements (résidences, collaborations)
CREATE TABLE IF NOT EXISTS public.artist_establishment_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL,
    establishment_id TEXT NOT NULL,
    establishment_name TEXT NOT NULL,
    relation_type TEXT DEFAULT 'resident', -- resident, collab, booking
    status TEXT DEFAULT 'pending', -- pending, active, ended
    initiated_by TEXT DEFAULT 'artist', -- artist, establishment
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ACTIVATION DES POLITIQUES RLS (Row Level Security)
-- =========================================================================

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_establishment_relations ENABLE ROW LEVEL SECURITY;

-- 1. Politiques pour artist_profiles
-- Lecture publique pour tous (visiteurs, clients, gérants)
CREATE POLICY "Lecture publique des profils artistes"
    ON public.artist_profiles FOR SELECT
    USING (true);

-- Insertion uniquement par l'utilisateur authentifié propriétaire de son profil
CREATE POLICY "Création de profil par son propriétaire"
    ON public.artist_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Modification uniquement par le propriétaire du profil
CREATE POLICY "Modification de profil par son propriétaire"
    ON public.artist_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Suppression uniquement par le propriétaire du profil
CREATE POLICY "Suppression de profil par son propriétaire"
    ON public.artist_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Politiques pour artist_bookings
CREATE POLICY "Lecture des bookings pour artistes et demandeurs"
    ON public.artist_bookings FOR SELECT
    USING (
      auth.uid() = requester_id OR 
      artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Création de booking par tout utilisateur authentifié"
    ON public.artist_bookings FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Mise à jour de booking par l'artiste concerné"
    ON public.artist_bookings FOR UPDATE
    USING (
      artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid()) OR
      auth.uid() = requester_id
    );

-- 3. Politiques pour artist_posts
CREATE POLICY "Lecture publique des publications d'artistes"
    ON public.artist_posts FOR SELECT
    USING (true);

CREATE POLICY "Création de posts par l'artiste propriétaire"
    ON public.artist_posts FOR INSERT
    WITH CHECK (
      artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Suppression de posts par l'artiste propriétaire"
    ON public.artist_posts FOR DELETE
    USING (
      artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
    );

-- 4. Politiques pour artist_stories
CREATE POLICY "Lecture publique des stories actives"
    ON public.artist_stories FOR SELECT
    USING (expires_at > NOW());

CREATE POLICY "Création de stories par l'artiste propriétaire"
    ON public.artist_stories FOR INSERT
    WITH CHECK (
      artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
    );

-- 5. Politiques pour artist_establishment_relations
CREATE POLICY "Lecture publique des relations artistes-établissements"
    ON public.artist_establishment_relations FOR SELECT
    USING (true);

CREATE POLICY "Gestion des relations par l'artiste ou l'établissement"
    ON public.artist_establishment_relations FOR INSERT
    WITH CHECK (
      artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Mise à jour des relations"
    ON public.artist_establishment_relations FOR UPDATE
    USING (
      artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
    );

-- =========================================================================
-- ZAKA+ : SCHEMA SQL SUPABASE & POLITIQUES RLS POUR LE MODULE « ZAKA BEAUTY »
-- Module dédié aux salons de coiffure, barbers, ongleries, spas et instituts
-- =========================================================================

-- 1. Table des salons et professionnels de beauté
CREATE TABLE IF NOT EXISTS public.beauty_salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    type_etablissement VARCHAR(100) NOT NULL DEFAULT 'coiffure_femme', -- coiffure_femme, barber, mixte, institut, onglerie, spa, maquillage, domicile, autre
    description TEXT,
    adresse TEXT,
    quartier VARCHAR(100),
    ville VARCHAR(100) NOT NULL DEFAULT 'Ouagadougou',
    pays VARCHAR(100) NOT NULL DEFAULT 'Burkina Faso',
    telephone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    photo_profil TEXT,
    photo_couverture TEXT,
    photos_galerie TEXT[] DEFAULT '{}',
    horaires_ouverture JSONB DEFAULT '{
        "lundi": {"ouvert": true, "ouverture": "08:30", "fermeture": "19:30"},
        "mardi": {"ouvert": true, "ouverture": "08:30", "fermeture": "19:30"},
        "mercredi": {"ouvert": true, "ouverture": "08:30", "fermeture": "19:30"},
        "jeudi": {"ouvert": true, "ouverture": "08:30", "fermeture": "19:30"},
        "vendredi": {"ouvert": true, "ouverture": "08:30", "fermeture": "20:00"},
        "samedi": {"ouvert": true, "ouverture": "08:00", "fermeture": "20:30"},
        "dimanche": {"ouvert": false, "ouverture": "10:00", "fermeture": "16:00"}
    }'::jsonb,
    note_moyenne NUMERIC(3,2) DEFAULT 5.00,
    total_avis INT DEFAULT 0,
    est_verifie BOOLEAN DEFAULT false,
    accepte_sans_rdv BOOLEAN DEFAULT true,
    a_domicile BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des prestations & services du salon
CREATE TABLE IF NOT EXISTS public.beauty_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) NOT NULL DEFAULT 'coiffure', -- coiffure, barbe, tresses, soins, ongles, maquillage, massage, epilation, autre
    duree_minutes INT NOT NULL DEFAULT 30,
    prix_fcfa INT NOT NULL,
    est_populaire BOOLEAN DEFAULT false,
    est_actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des réservations et prises de rendez-vous
CREATE TABLE IF NOT EXISTS public.beauty_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.beauty_services(id) ON DELETE SET NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nom_client VARCHAR(255) NOT NULL,
    telephone_client VARCHAR(50) NOT NULL,
    date_rdv DATE NOT NULL,
    heure_rdv VARCHAR(20) NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'en_attente', -- en_attente, confirme, annule, termine
    notes_client TEXT,
    notes_salon TEXT,
    prix_total_fcfa INT,
    a_domicile BOOLEAN DEFAULT false,
    adresse_domicile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des avis et évaluations clients
CREATE TABLE IF NOT EXISTS public.beauty_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.beauty_salons(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_client VARCHAR(255) NOT NULL,
    note INT NOT NULL CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    reponse_salon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- INDEXES DE PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_beauty_salons_user ON public.beauty_salons(user_id);
CREATE INDEX IF NOT EXISTS idx_beauty_salons_ville ON public.beauty_salons(ville);
CREATE INDEX IF NOT EXISTS idx_beauty_salons_type ON public.beauty_salons(type_etablissement);
CREATE INDEX IF NOT EXISTS idx_beauty_services_salon ON public.beauty_services(salon_id);
CREATE INDEX IF NOT EXISTS idx_beauty_appointments_salon ON public.beauty_appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_beauty_appointments_client ON public.beauty_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_beauty_reviews_salon ON public.beauty_reviews(salon_id);

-- =========================================================================
-- ACTIVATION DU ROW LEVEL SECURITY (RLS) & FONCTIONS DE SÉCURITÉ
-- =========================================================================
ALTER TABLE public.beauty_salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beauty_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beauty_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beauty_reviews ENABLE ROW LEVEL SECURITY;

-- Fonction helper SECURITY DEFINER pour vérifier si l'utilisateur est bien le propriétaire du salon ET a le rôle 'salon_coiffure' (ou 'admin')
CREATE OR REPLACE FUNCTION public.is_beauty_salon_owner(p_salon_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.beauty_salons s
    JOIN public.users u ON u.id = s.user_id
    WHERE s.id = p_salon_id 
      AND s.user_id = auth.uid()
      AND (u.role = 'salon_coiffure' OR u.role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour vérifier si l'utilisateur a le rôle 'salon_coiffure' ou 'admin'
CREATE OR REPLACE FUNCTION public.is_beauty_pro()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users u
    WHERE u.id = auth.uid()
      AND (u.role = 'salon_coiffure' OR u.role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- Politiques RLS pour beauty_salons
-- -------------------------------------------------------------------------
-- 1. Lecture publique de tous les salons de beauté
CREATE POLICY "beauty_salons_select_public" 
    ON public.beauty_salons FOR SELECT 
    USING (true);

-- 2. Création de salon autorisée uniquement pour les utilisateurs ayant le rôle 'salon_coiffure' ou 'admin'
CREATE POLICY "beauty_salons_insert_pro" 
    ON public.beauty_salons FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id 
        AND public.is_beauty_pro()
    );

-- 3. Modification uniquement par le propriétaire du salon (rôle 'salon_coiffure' vérifié)
CREATE POLICY "beauty_salons_update_owner" 
    ON public.beauty_salons FOR UPDATE 
    USING (
        auth.uid() = user_id 
        AND public.is_beauty_pro()
    )
    WITH CHECK (
        auth.uid() = user_id 
        AND public.is_beauty_pro()
    );

-- 4. Suppression par le gérant propriétaire du salon
CREATE POLICY "beauty_salons_delete_owner" 
    ON public.beauty_salons FOR DELETE 
    USING (
        auth.uid() = user_id 
        AND public.is_beauty_pro()
    );

-- -------------------------------------------------------------------------
-- Politiques RLS pour beauty_services
-- -------------------------------------------------------------------------
-- 1. Lecture publique des services
CREATE POLICY "beauty_services_select_public" 
    ON public.beauty_services FOR SELECT 
    USING (true);

-- 2. Création de service : seul le propriétaire du salon (rôle 'salon_coiffure') peut ajouter
CREATE POLICY "beauty_services_insert_owner" 
    ON public.beauty_services FOR INSERT 
    WITH CHECK (
        public.is_beauty_salon_owner(salon_id)
    );

-- 3. Modification de service : seul le propriétaire du salon peut modifier ses services
CREATE POLICY "beauty_services_update_owner" 
    ON public.beauty_services FOR UPDATE 
    USING (
        public.is_beauty_salon_owner(salon_id)
    )
    WITH CHECK (
        public.is_beauty_salon_owner(salon_id)
    );

-- 4. Suppression de service : seul le propriétaire du salon peut supprimer
CREATE POLICY "beauty_services_delete_owner" 
    ON public.beauty_services FOR DELETE 
    USING (
        public.is_beauty_salon_owner(salon_id)
    );

-- -------------------------------------------------------------------------
-- Politiques RLS pour beauty_appointments
-- -------------------------------------------------------------------------
-- 1. Lecture des rendez-vous : le propriétaire du salon (salon_coiffure) OU le client auteur du rdv
CREATE POLICY "beauty_appointments_select_authorized" 
    ON public.beauty_appointments FOR SELECT 
    USING (
        auth.uid() = client_id OR 
        public.is_beauty_salon_owner(salon_id)
    );

-- 2. Création de rendez-vous : tout client (authentifié ou invité avec check)
CREATE POLICY "beauty_appointments_insert_client" 
    ON public.beauty_appointments FOR INSERT 
    WITH CHECK (
        auth.uid() = client_id OR client_id IS NULL OR auth.uid() IS NOT NULL
    );

-- 3. Gestion des rendez-vous (confirmer, terminer, annuler) : 
--    Le propriétaire du salon (salon_coiffure) ou le client pour annuler
CREATE POLICY "beauty_appointments_update_authorized" 
    ON public.beauty_appointments FOR UPDATE 
    USING (
        public.is_beauty_salon_owner(salon_id) OR 
        auth.uid() = client_id
    )
    WITH CHECK (
        public.is_beauty_salon_owner(salon_id) OR 
        auth.uid() = client_id
    );

-- 4. Suppression de rendez-vous : seul le propriétaire du salon
CREATE POLICY "beauty_appointments_delete_owner" 
    ON public.beauty_appointments FOR DELETE 
    USING (
        public.is_beauty_salon_owner(salon_id)
    );

-- -------------------------------------------------------------------------
-- Politiques RLS pour beauty_reviews
-- -------------------------------------------------------------------------
-- 1. Lecture publique des avis
CREATE POLICY "beauty_reviews_select_public" 
    ON public.beauty_reviews FOR SELECT 
    USING (true);

-- 2. Création d'avis par un client connecté
CREATE POLICY "beauty_reviews_insert_client" 
    ON public.beauty_reviews FOR INSERT 
    WITH CHECK (
        auth.uid() = client_id OR auth.uid() IS NOT NULL
    );

-- 3. Réponse à un avis : seul le propriétaire du salon (rôle 'salon_coiffure')
CREATE POLICY "beauty_reviews_update_salon_reply" 
    ON public.beauty_reviews FOR UPDATE 
    USING (
        public.is_beauty_salon_owner(salon_id)
    )
    WITH CHECK (
        public.is_beauty_salon_owner(salon_id)
    );

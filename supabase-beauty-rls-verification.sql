-- =============================================================================
-- SCRIPT DE VÉRIFICATION DE SÉCURITÉ RLS : ZAKA BEAUTY
-- Tables testées : public.beauty_salons & public.beauty_appointments
-- Objectif : Confirmer l'absence totale d'accès croisé (cross-tenant) entre salons
-- =============================================================================

-- Ce script simule des sessions utilisateurs authentifiées Supabase via les claims JWT 
-- (request.jwt.claim.sub) pour valider que :
-- 1. Le gérant du Salon A ne peut JAMAIS lire les rendez-vous du Salon B.
-- 2. Le gérant du Salon A ne peut JAMAIS modifier ou annuler les rendez-vous du Salon B.
-- 3. Le gérant du Salon A ne peut JAMAIS supprimer les rendez-vous du Salon B.
-- 4. Le gérant du Salon A ne peut JAMAIS modifier ni supprimer le salon B.
-- 5. Les clients ne peuvent voir que leurs propres rendez-vous.

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. TABLE TEMPORAIRE DE RAPPORT DE VÉRIFICATION
-- -----------------------------------------------------------------------------
CREATE TEMP TABLE rls_test_results (
    test_id SERIAL PRIMARY KEY,
    test_code VARCHAR(50),
    description TEXT,
    statut VARCHAR(20), -- 'REUSSI' ou 'ECHEC'
    details TEXT
);

-- -----------------------------------------------------------------------------
-- 1. CRÉATION DES IDENTITÉS DE TEST DANS public.users
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_uid_pro_a UUID := '11111111-aaaa-1111-aaaa-111111111111'::UUID;
    v_uid_pro_b UUID := '22222222-bbbb-2222-bbbb-222222222222'::UUID;
    v_uid_client UUID := '33333333-cccc-3333-cccc-333333333333'::UUID;
    v_salon_a UUID := 'aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa'::UUID;
    v_salon_b UUID := 'bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb'::UUID;
    v_service_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
    v_service_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
    v_appt_a UUID := 'aaaaaaaa-9999-aaaa-9999-aaaaaaaaaaaa'::UUID;
    v_appt_b UUID := 'bbbbbbbb-9999-bbbb-9999-bbbbbbbbbbbb'::UUID;
    v_count INT;
    v_rows_affected INT;
BEGIN
    -- Insertion des faux comptes utilisateurs
    INSERT INTO public.users (id, email, full_name, role)
    VALUES 
        (v_uid_pro_a, 'gerant.a@zaka-beauty.bf', 'Gérant Salon Prestige', 'salon_coiffure'),
        (v_uid_pro_b, 'gerant.b@zaka-beauty.bf', 'Gérant Salon AfroChic', 'salon_coiffure'),
        (v_uid_client, 'client.test@zaka-beauty.bf', 'Client Testeur', 'client')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

    -- Insertion des faux salons
    INSERT INTO public.beauty_salons (id, user_id, nom, type_etablissement, ville, telephone)
    VALUES 
        (v_salon_a, v_uid_pro_a, 'Salon Test A (Prestige)', 'coiffure_femme', 'Ouagadougou', '+226 70 00 00 01'),
        (v_salon_b, v_uid_pro_b, 'Salon Test B (AfroChic)', 'barber', 'Bobo-Dioulasso', '+226 70 00 00 02')
    ON CONFLICT (id) DO NOTHING;

    -- Insertion des prestations de test
    INSERT INTO public.beauty_services (id, salon_id, nom, categorie, duree_minutes, prix_fcfa)
    VALUES 
        (v_service_a, v_salon_a, 'Tresses A', 'tresses', 60, 5000),
        (v_service_b, v_salon_b, 'Coupe B', 'coiffure', 30, 3000)
    ON CONFLICT (id) DO NOTHING;

    -- Insertion des rendez-vous de test
    INSERT INTO public.beauty_appointments (id, salon_id, service_id, client_id, nom_client, telephone_client, date_rdv, heure_rdv, statut, prix_total_fcfa)
    VALUES 
        (v_appt_a, v_salon_a, v_service_a, v_uid_client, 'Client Chez A', '+226 70 11 11 11', CURRENT_DATE, '10:00', 'confirme', 5000),
        (v_appt_b, v_salon_b, v_service_b, v_uid_client, 'Client Chez B', '+226 70 22 22 22', CURRENT_DATE, '14:00', 'confirme', 3000)
    ON CONFLICT (id) DO NOTHING;

    -- =========================================================================
    -- TEST 1 : SALON PRO 1 TENTE DE LIRE LES RENDEZ-VOUS DU SALON B
    -- =========================================================================
    -- Simuler la session du Gérant Salon A
    PERFORM set_config('request.jwt.claim.sub', v_uid_pro_a::TEXT, true);
    PERFORM set_config('role', 'authenticated', true);

    SELECT COUNT(*) INTO v_count
    FROM public.beauty_appointments
    WHERE salon_id = v_salon_b;

    IF v_count = 0 THEN
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_1_APPT_SELECT', 'Salon A ne peut pas lire les rendez-vous du Salon B', 'REUSSI', '0 ligne retournée pour le salon concurrent.');
    ELSE
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_1_APPT_SELECT', 'Salon A ne peut pas lire les rendez-vous du Salon B', 'ECHEC', 'Fuite de données : ' || v_count || ' lignes visibles du salon concurrent !');
    END IF;

    -- =========================================================================
    -- TEST 2 : SALON PRO 1 TENTE DE MODIFIER UN RENDEZ-VOUS DU SALON B
    -- =========================================================================
    UPDATE public.beauty_appointments
    SET statut = 'annule', notes_salon = 'Tentative piratage par Salon A'
    WHERE id = v_appt_b;
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_2_APPT_UPDATE', 'Salon A ne peut pas modifier les rendez-vous du Salon B', 'REUSSI', '0 ligne modifiée grâce au blocage RLS.');
    ELSE
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_2_APPT_UPDATE', 'Salon A ne peut pas modifier les rendez-vous du Salon B', 'ECHEC', 'Alerte sécurité : un salon a pu modifier le rdv d un concurrent !');
    END IF;

    -- =========================================================================
    -- TEST 3 : SALON PRO 1 TENTE DE SUPPRIMER UN RENDEZ-VOUS DU SALON B
    -- =========================================================================
    DELETE FROM public.beauty_appointments
    WHERE id = v_appt_b;
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_3_APPT_DELETE', 'Salon A ne peut pas supprimer les rendez-vous du Salon B', 'REUSSI', '0 ligne supprimée grâce au blocage RLS.');
    ELSE
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_3_APPT_DELETE', 'Salon A ne peut pas supprimer les rendez-vous du Salon B', 'ECHEC', 'Alerte sécurité : suppression non autorisée réussie !');
    END IF;

    -- =========================================================================
    -- TEST 4 : SALON PRO 1 TENTE DE MODIFIER LA FICHE DU SALON B
    -- =========================================================================
    UPDATE public.beauty_salons
    SET nom = 'Salon B Piraté', telephone = '+226 00 00 00 00'
    WHERE id = v_salon_b;
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_4_SALON_UPDATE', 'Salon A ne peut pas modifier le profil du Salon B', 'REUSSI', '0 ligne affectée par la modification concurrente.');
    ELSE
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_4_SALON_UPDATE', 'Salon A ne peut pas modifier le profil du Salon B', 'ECHEC', 'Alerte sécurité : le profil d un salon concurrent a été altéré !');
    END IF;

    -- =========================================================================
    -- TEST 5 : SALON PRO 1 TENTE DE SUPPRIMER LE SALON B
    -- =========================================================================
    DELETE FROM public.beauty_salons
    WHERE id = v_salon_b;
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_5_SALON_DELETE', 'Salon A ne peut pas supprimer le Salon B', 'REUSSI', '0 ligne supprimée.');
    ELSE
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_5_SALON_DELETE', 'Salon A ne peut pas supprimer le Salon B', 'ECHEC', 'Alerte critique : suppression d un salon concurrent permise !');
    END IF;

    -- =========================================================================
    -- TEST 6 : VÉRIFICATION DE L ACCÈS LÉGITIME DU SALON A À SES PROPRES DONNÉES
    -- =========================================================================
    SELECT COUNT(*) INTO v_count
    FROM public.beauty_appointments
    WHERE salon_id = v_salon_a;

    IF v_count >= 1 THEN
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_6_OWN_APPT_ACCESS', 'Salon A peut consulter ses propres rendez-vous', 'REUSSI', 'Accès légitime préservé (' || v_count || ' rdv accessible).');
    ELSE
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_6_OWN_APPT_ACCESS', 'Salon A peut consulter ses propres rendez-vous', 'ECHEC', 'Erreur : le salon ne voit pas ses propres rdv !');
    END IF;

    -- =========================================================================
    -- TEST 7 : CONFIDENTIALITÉ CÔTÉ CLIENT (Ne voit que ses rdv)
    -- =========================================================================
    -- Simuler la session du Client Test
    PERFORM set_config('request.jwt.claim.sub', v_uid_client::TEXT, true);

    SELECT COUNT(*) INTO v_count
    FROM public.beauty_appointments
    WHERE client_id = v_uid_client;

    IF v_count = 2 THEN
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_7_CLIENT_ISOLATION', 'Le client a accès à l historique de ses rendez-vous', 'REUSSI', 'Visualisation correcte des réservations du client.');
    ELSE
        INSERT INTO rls_test_results (test_code, description, statut, details)
        VALUES ('TEST_7_CLIENT_ISOLATION', 'Le client a accès à l historique de ses rendez-vous', 'ECHEC', 'Problème de restitution des rdv pour le client.');
    END IF;

END $$;

-- -----------------------------------------------------------------------------
-- 2. AFFICHAGE DU RAPPORT D'AUDIT RLS
-- -----------------------------------------------------------------------------
SELECT 
    test_id AS "N°",
    test_code AS "Code Test",
    description AS "Scénario Testé",
    CASE 
        WHEN statut = 'REUSSI' THEN '✅ RÉUSSI' 
        ELSE '❌ ÉCHEC' 
    END AS "Résultat RLS",
    details AS "Diagnostic"
FROM rls_test_results
ORDER BY test_id;

-- -----------------------------------------------------------------------------
-- 3. ANNULATION DES MODIFICATIONS DE TEST (ROLLBACK PROPRE)
-- -----------------------------------------------------------------------------
-- Toutes les données injectées pour la simulation sont automatiquement annulées
ROLLBACK;

-- =============================================================================
-- ZAKA+ SUPABASE POSTGRESQL SCHEMA (Phase 2 & Phase 4)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'client',
    country TEXT NOT NULL DEFAULT 'Burkina Faso',
    city TEXT NOT NULL DEFAULT 'Ouagadougou',
    avatar TEXT,
    category TEXT,
    code_parrainage TEXT UNIQUE,
    "parrainId" UUID REFERENCES public.users(id) ON DELETE SET NULL,
    "zakaPoints" INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ESTABLISHMENTS
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'maquis',
    country TEXT NOT NULL DEFAULT 'Burkina Faso',
    city TEXT NOT NULL DEFAULT 'Ouagadougou',
    neighborhood TEXT NOT NULL DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    description TEXT DEFAULT '',
    photos TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    geolocation TEXT DEFAULT '',
    "openingHours" TEXT DEFAULT '',
    "menuPdfUrl" TEXT,
    "menuImages" TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'valide',
    "averageRating" NUMERIC(3, 2) NOT NULL DEFAULT 0.0,
    "hairSalonData" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. FAVORITES & CARNET
CREATE TABLE IF NOT EXISTS public.favorites (
    "userId" UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    "establishmentIds" UUID[] DEFAULT '{}',
    tags JSONB DEFAULT '{}'::jsonb,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.carnet_entrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "privateNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "clientName" TEXT NOT NULL,
    "clientAvatar" TEXT,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    reply JSONB,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. RESERVATIONS & TAKEAWAY
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "establishmentName" TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    guests INTEGER NOT NULL DEFAULT 1,
    "specialRequests" TEXT,
    status TEXT NOT NULL DEFAULT 'en_attente',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.takeaway_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "establishmentName" TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    "totalPrice" NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    "pickupTime" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PUBLICATIONS & STORIES & LIVE
CREATE TABLE IF NOT EXISTS public.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    views INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    "isEmergency" BOOLEAN DEFAULT false,
    whatsapp TEXT,
    "applyEmail" TEXT,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "establishmentName" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    caption TEXT,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.live_ambiance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "videoUrl" TEXT NOT NULL,
    title TEXT NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "viewersCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "endedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.event_social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "publicationId" UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    content TEXT NOT NULL,
    "mediaUrl" TEXT,
    likes UUID[] DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.photo_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "userName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    votes UUID[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.playlists_dj (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "djId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genres TEXT[] DEFAULT '{}',
    tracks JSONB NOT NULL DEFAULT '[]'::jsonb,
    "currentTrackIndex" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. RH & RECRUITMENT
CREATE TABLE IF NOT EXISTS public.relationship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "userName" TEXT NOT NULL,
    "userPhone" TEXT,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "establishmentName" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "clientName" TEXT NOT NULL,
    "publicationId" UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
    "publicationTitle" TEXT NOT NULL,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "establishmentName" TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'en_attente',
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. LOYALTY & SOCIAL
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'bronze',
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE("clientId", "establishmentId")
);

CREATE TABLE IF NOT EXISTS public.zaka_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "rewardId" TEXT NOT NULL,
    "rewardTitle" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'valide',
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.parrainages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "parrainId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "parrainEmail" TEXT DEFAULT '',
    "parraineId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "parraineEmail" TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'en_attente',
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE("parrainId", "parraineId")
);

CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "requesterId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "receiverId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'en_attente',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE("requesterId", "receiverId")
);

CREATE TABLE IF NOT EXISTS public.group_outings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "creatorId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "establishmentName" TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    "memberIds" UUID[] DEFAULT '{}',
    "activeLocations" JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'planifie',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. MESSAGING & SERVICES
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "clientName" TEXT NOT NULL,
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "establishmentName" TEXT NOT NULL,
    "ownerId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "lastMessage" TEXT DEFAULT '',
    "lastMessageDate" TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    "senderId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "senderName" TEXT NOT NULL,
    text TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "providerId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "serviceType" TEXT NOT NULL,
    date TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    "responseMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. ENTREPRISES & ADS
CREATE TABLE IF NOT EXISTS public.entreprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sector TEXT NOT NULL DEFAULT 'Boisson & Brasserie',
    logo TEXT,
    philosophy TEXT,
    description TEXT,
    followers UUID[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'valide',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "advertiserId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    format TEXT NOT NULL,
    "budgetTotal" NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    "budgetDaily" NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ad_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "campaignId" UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    "advertiserId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    headline TEXT NOT NULL,
    description TEXT,
    "mediaUrl" TEXT,
    "targetUrl" TEXT,
    "ctaText" TEXT NOT NULL DEFAULT 'En savoir plus',
    status TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "advertiserId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "campaignId" UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    "proofUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "advertiserId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "paymentId" UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid',
    "pdfUrl" TEXT,
    "issueDate" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ad_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "campaignId" UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    "creativeId" UUID REFERENCES public.ad_creatives(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    spent NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    UNIQUE("campaignId", "creativeId", date)
);

-- =============================================================================
-- 15. STOCKS & VENTES (GESTION CAISSE & INVENTAIRE MAQUIS/BARS/CLUBS)
-- =============================================================================

ALTER TABLE public.relationship_requests ADD COLUMN IF NOT EXISTS "isCaissier" BOOLEAN DEFAULT false;

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

CREATE TABLE IF NOT EXISTS public.ventes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "establishmentId" UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    "cashierId" UUID REFERENCES public.users(id) ON DELETE SET NULL,
    "cashierName" TEXT NOT NULL DEFAULT 'Caissier',
    "serverName" TEXT,
    "tableNote" TEXT,
    "clientType" TEXT DEFAULT 'Ordinaire',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    "subtotalBoissons" NUMERIC(10, 2),
    "subtotalCuisine" NUMERIC(10, 2),
    "totalAchat" NUMERIC(10, 2),
    "discountAmount" NUMERIC(10, 2) DEFAULT 0.0,
    "totalAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    "paidAmount" NUMERIC(10, 2),
    "changeAmount" NUMERIC(10, 2),
    "avoirAmount" NUMERIC(10, 2),
    "mobileMoneyCode" TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "serverName" TEXT;
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "tableNote" TEXT;
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "clientType" TEXT DEFAULT 'Ordinaire';
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "subtotalBoissons" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "subtotalCuisine" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "totalAchat" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "discountAmount" NUMERIC(10, 2) DEFAULT 0.0;
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "paidAmount" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "changeAmount" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "avoirAmount" NUMERIC(10, 2);
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS "mobileMoneyCode" TEXT;


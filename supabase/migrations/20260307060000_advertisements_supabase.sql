-- Advertisement Management Migration
-- Moves advertisement data from localStorage to Supabase
-- Tables: advertisements, advertisement_analytics

-- ============================================
-- STEP 1: TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    bg_color TEXT DEFAULT '#c0392b',
    duration INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    skip_count INTEGER DEFAULT 0,
    total_engagement_time INTEGER DEFAULT 0,
    engagement_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.advertisement_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    engagement_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 2: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON public.advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_display_order ON public.advertisements(display_order);
CREATE INDEX IF NOT EXISTS idx_advertisement_analytics_ad_id ON public.advertisement_analytics(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_advertisement_analytics_event_type ON public.advertisement_analytics(event_type);

-- ============================================
-- STEP 3: UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.update_advertisements_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================
-- STEP 4: ENABLE RLS
-- ============================================

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisement_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: RLS POLICIES
-- ============================================

-- Advertisements: All authenticated users can read (parents need to see ads)
DROP POLICY IF EXISTS "authenticated_read_advertisements" ON public.advertisements;
CREATE POLICY "authenticated_read_advertisements"
ON public.advertisements
FOR SELECT
TO authenticated
USING (true);

-- Advertisements: Admin/Owner can manage all
DROP POLICY IF EXISTS "admin_manage_all_advertisements" ON public.advertisements;
CREATE POLICY "admin_manage_all_advertisements"
ON public.advertisements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin'::public.user_role, 'owner'::public.user_role)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin'::public.user_role, 'owner'::public.user_role)
    )
);

-- Advertisement Analytics: All authenticated users can insert (parents tracking views)
DROP POLICY IF EXISTS "authenticated_insert_advertisement_analytics" ON public.advertisement_analytics;
CREATE POLICY "authenticated_insert_advertisement_analytics"
ON public.advertisement_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Advertisement Analytics: Admin/Owner can read all analytics
DROP POLICY IF EXISTS "admin_read_advertisement_analytics" ON public.advertisement_analytics;
CREATE POLICY "admin_read_advertisement_analytics"
ON public.advertisement_analytics
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin'::public.user_role, 'owner'::public.user_role)
    )
);

-- ============================================
-- STEP 6: TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_advertisements_updated_at ON public.advertisements;
CREATE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON public.advertisements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_advertisements_updated_at();

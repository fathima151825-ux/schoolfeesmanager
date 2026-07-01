-- Class Fee Structures Migration
-- Stores fee amounts per class (not per student) for each academic year, term, and fee category
-- Admin sets these; students see the fee structure for their class

-- ============================================
-- STEP 1: Create class_fee_structures table
-- ============================================

CREATE TABLE IF NOT EXISTS public.class_fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name TEXT NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term public.term_name NOT NULL,
    fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_name, academic_year_id, term, fee_category_id)
);

-- ============================================
-- STEP 2: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_class_fee_structures_class_name ON public.class_fee_structures(class_name);
CREATE INDEX IF NOT EXISTS idx_class_fee_structures_academic_year_id ON public.class_fee_structures(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_class_fee_structures_term ON public.class_fee_structures(term);

-- ============================================
-- STEP 3: Updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION public.update_class_fee_structures_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_class_fee_structures_updated_at ON public.class_fee_structures;
CREATE TRIGGER set_class_fee_structures_updated_at
    BEFORE UPDATE ON public.class_fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_class_fee_structures_updated_at();

-- ============================================
-- STEP 4: Enable RLS
-- ============================================

ALTER TABLE public.class_fee_structures ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: RLS Policies
-- ============================================

-- Anyone (authenticated or anon) can read class fee structures
DROP POLICY IF EXISTS "public_read_class_fee_structures" ON public.class_fee_structures;
CREATE POLICY "public_read_class_fee_structures"
ON public.class_fee_structures
FOR SELECT
TO public
USING (true);

-- Only admins/owners can insert/update/delete class fee structures
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
    AND up.role IN ('admin', 'owner', 'superadmin')
    AND up.is_active = true
)
$$;

DROP POLICY IF EXISTS "admin_manage_class_fee_structures" ON public.class_fee_structures;
CREATE POLICY "admin_manage_class_fee_structures"
ON public.class_fee_structures
FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- ============================================
-- STEP 6: Seed default fee categories if empty
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.fee_categories LIMIT 1) THEN
        INSERT INTO public.fee_categories (id, name, description, is_active) VALUES
            (gen_random_uuid(), 'Tuition Fees', 'Academic instruction fees', true),
            (gen_random_uuid(), 'Van Fees', 'Transportation charges', true),
            (gen_random_uuid(), 'Book Fees', 'Textbooks and study materials', true),
            (gen_random_uuid(), 'Miscellaneous Fees', 'Sports, activities, and other charges', true),
            (gen_random_uuid(), 'Lab Caution Deposit', 'Refundable deposit for lab equipment', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

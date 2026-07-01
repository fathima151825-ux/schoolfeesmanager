-- ============================================================
-- Classes Master Table Migration
-- Creates a canonical classes table with UUIDs.
-- Migrates students.class (text) → students.class_id (UUID FK)
-- Migrates class_fee_structures.class_name (text) → class_id (UUID FK)
-- All modules must use class_id; Roman numerals / display names are UI only.
-- ============================================================

-- ============================================================
-- STEP 1: Create classes master table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,           -- canonical short name: 'LKG', 'I', 'X', 'XII'
    display_name TEXT NOT NULL,          -- human-readable: 'Class LKG', 'Class I', 'Class X'
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STEP 2: Seed canonical class list (idempotent)
-- ============================================================

INSERT INTO public.classes (name, display_name, sort_order) VALUES
    ('LKG',  'Class LKG',  1),
    ('UKG',  'Class UKG',  2),
    ('I',    'Class I',    3),
    ('II',   'Class II',   4),
    ('III',  'Class III',  5),
    ('IV',   'Class IV',   6),
    ('V',    'Class V',    7),
    ('VI',   'Class VI',   8),
    ('VII',  'Class VII',  9),
    ('VIII', 'Class VIII', 10),
    ('IX',   'Class IX',   11),
    ('X',    'Class X',    12),
    ('XI',   'Class XI',   13),
    ('XII',  'Class XII',  14)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    sort_order   = EXCLUDED.sort_order,
    updated_at   = CURRENT_TIMESTAMP;

-- ============================================================
-- STEP 3: Add class_id column to students (nullable first for migration)
-- ============================================================

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- ============================================================
-- STEP 4: Populate students.class_id from students.class (text)
-- ============================================================

UPDATE public.students s
SET class_id = c.id
FROM public.classes c
WHERE TRIM(s.class) = c.name
  AND s.class_id IS NULL;

-- Handle common alternate formats: '10' → 'X', '9' → 'IX', etc.
-- Numeric class names used in some imports
UPDATE public.students s
SET class_id = c.id
FROM public.classes c
WHERE s.class_id IS NULL
  AND (
    (TRIM(s.class) = '1'  AND c.name = 'I')   OR
    (TRIM(s.class) = '2'  AND c.name = 'II')  OR
    (TRIM(s.class) = '3'  AND c.name = 'III') OR
    (TRIM(s.class) = '4'  AND c.name = 'IV')  OR
    (TRIM(s.class) = '5'  AND c.name = 'V')   OR
    (TRIM(s.class) = '6'  AND c.name = 'VI')  OR
    (TRIM(s.class) = '7'  AND c.name = 'VII') OR
    (TRIM(s.class) = '8'  AND c.name = 'VIII')OR
    (TRIM(s.class) = '9'  AND c.name = 'IX')  OR
    (TRIM(s.class) = '10' AND c.name = 'X')   OR
    (TRIM(s.class) = '11' AND c.name = 'XI')  OR
    (TRIM(s.class) = '12' AND c.name = 'XII')
  );

-- Handle 'Class X', 'Class I', etc. prefix format
UPDATE public.students s
SET class_id = c.id
FROM public.classes c
WHERE s.class_id IS NULL
  AND TRIM(UPPER(s.class)) = UPPER('Class ' || c.name);

-- ============================================================
-- STEP 5: Add class_id column to class_fee_structures
-- ============================================================

ALTER TABLE public.class_fee_structures
    ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 6: Populate class_fee_structures.class_id from class_name (text)
-- ============================================================

UPDATE public.class_fee_structures cfs
SET class_id = c.id
FROM public.classes c
WHERE TRIM(cfs.class_name) = c.name
  AND cfs.class_id IS NULL;

-- Handle numeric formats
UPDATE public.class_fee_structures cfs
SET class_id = c.id
FROM public.classes c
WHERE cfs.class_id IS NULL
  AND (
    (TRIM(cfs.class_name) = '1'  AND c.name = 'I')   OR
    (TRIM(cfs.class_name) = '2'  AND c.name = 'II')  OR
    (TRIM(cfs.class_name) = '3'  AND c.name = 'III') OR
    (TRIM(cfs.class_name) = '4'  AND c.name = 'IV')  OR
    (TRIM(cfs.class_name) = '5'  AND c.name = 'V')   OR
    (TRIM(cfs.class_name) = '6'  AND c.name = 'VI')  OR
    (TRIM(cfs.class_name) = '7'  AND c.name = 'VII') OR
    (TRIM(cfs.class_name) = '8'  AND c.name = 'VIII')OR
    (TRIM(cfs.class_name) = '9'  AND c.name = 'IX')  OR
    (TRIM(cfs.class_name) = '10' AND c.name = 'X')   OR
    (TRIM(cfs.class_name) = '11' AND c.name = 'XI')  OR
    (TRIM(cfs.class_name) = '12' AND c.name = 'XII')
  );

-- Handle 'Class X' prefix format
UPDATE public.class_fee_structures cfs
SET class_id = c.id
FROM public.classes c
WHERE cfs.class_id IS NULL
  AND TRIM(UPPER(cfs.class_name)) = UPPER('Class ' || c.name);

-- ============================================================
-- STEP 7: Fix the UNIQUE constraint on class_fee_structures
-- to use class_id instead of class_name
-- ============================================================

-- Drop old unique constraint (by name from original migration)
ALTER TABLE public.class_fee_structures
    DROP CONSTRAINT IF EXISTS class_fee_structures_class_name_academic_year_id_term_fee_cat_key;

-- Also try the auto-generated name pattern
DO $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.class_fee_structures'::regclass
      AND contype = 'u'
      AND conname LIKE '%class_name%'
    LIMIT 1;

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.class_fee_structures DROP CONSTRAINT IF EXISTS ' || quote_ident(v_constraint_name);
    END IF;
END $$;

-- Add new unique constraint using class_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.class_fee_structures'::regclass
          AND contype = 'u'
          AND conname = 'class_fee_structures_class_id_year_term_cat_key'
    ) THEN
        ALTER TABLE public.class_fee_structures
            ADD CONSTRAINT class_fee_structures_class_id_year_term_cat_key
            UNIQUE (class_id, academic_year_id, term, fee_category_id);
    END IF;
END $$;

-- ============================================================
-- STEP 8: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_fee_structures_class_id ON public.class_fee_structures(class_id);

-- ============================================================
-- STEP 9: Updated_at trigger for classes
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_classes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_classes_updated_at();

-- ============================================================
-- STEP 10: RLS for classes table
-- ============================================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_classes" ON public.classes;
CREATE POLICY "public_read_classes"
ON public.classes
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_classes" ON public.classes;
CREATE POLICY "admin_manage_classes"
ON public.classes
FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- ============================================================
-- STEP 11: Update copy_fee_structure function to use class_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.copy_fee_structure(
  p_source_year_id UUID,
  p_target_year_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Delete existing fee structures for target year to avoid conflicts
  DELETE FROM public.class_fee_structures WHERE academic_year_id = p_target_year_id;

  -- Copy fee structures from source year to target year (using class_id)
  INSERT INTO public.class_fee_structures (
    class_name,
    class_id,
    academic_year_id,
    term,
    fee_category_id,
    amount,
    due_date,
    created_at,
    updated_at
  )
  SELECT
    class_name,
    class_id,
    p_target_year_id,
    term,
    fee_category_id,
    amount,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM public.class_fee_structures
  WHERE academic_year_id = p_source_year_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- STEP 12: Helper function — get class_id by name (for app use)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_class_id_by_name(p_class_name TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT id FROM public.classes
WHERE name = TRIM(p_class_name)
   OR name = CASE
        WHEN TRIM(p_class_name) = '1'  THEN 'I'
        WHEN TRIM(p_class_name) = '2'  THEN 'II'
        WHEN TRIM(p_class_name) = '3'  THEN 'III'
        WHEN TRIM(p_class_name) = '4'  THEN 'IV'
        WHEN TRIM(p_class_name) = '5'  THEN 'V'
        WHEN TRIM(p_class_name) = '6'  THEN 'VI'
        WHEN TRIM(p_class_name) = '7'  THEN 'VII'
        WHEN TRIM(p_class_name) = '8'  THEN 'VIII'
        WHEN TRIM(p_class_name) = '9'  THEN 'IX'
        WHEN TRIM(p_class_name) = '10' THEN 'X'
        WHEN TRIM(p_class_name) = '11' THEN 'XI'
        WHEN TRIM(p_class_name) = '12' THEN 'XII'
        ELSE TRIM(p_class_name)
      END
LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_class_id_by_name(TEXT) TO authenticated, anon;

-- ============================================================
-- STEP 13: Verification report
-- ============================================================

DO $$
DECLARE
    v_students_without_class_id INTEGER;
    v_cfs_without_class_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_students_without_class_id
    FROM public.students WHERE class_id IS NULL AND is_active = true;

    SELECT COUNT(*) INTO v_cfs_without_class_id
    FROM public.class_fee_structures WHERE class_id IS NULL;

    RAISE NOTICE '=== Classes Migration Report ===';
    RAISE NOTICE 'Active students without class_id: %', v_students_without_class_id;
    RAISE NOTICE 'Fee structure rows without class_id: %', v_cfs_without_class_id;

    IF v_students_without_class_id > 0 THEN
        RAISE NOTICE 'WARNING: Some students could not be mapped. Check students.class values.';
    END IF;
    IF v_cfs_without_class_id > 0 THEN
        RAISE NOTICE 'WARNING: Some fee structure rows could not be mapped. Check class_fee_structures.class_name values.';
    END IF;
END $$;

-- Academic Year Management Migration
-- Adds copy_fee_structure_from_year function and ensures proper academic year management

-- ============================================
-- STEP 1: Ensure academic_years table has all needed columns
-- ============================================

ALTER TABLE public.academic_years 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- ============================================
-- STEP 2: Function to set a specific year as current (atomic)
-- ============================================

CREATE OR REPLACE FUNCTION public.set_current_academic_year(p_year_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, unset all current years
  UPDATE public.academic_years SET is_current = false WHERE is_current = true;
  -- Set the requested year as current
  UPDATE public.academic_years SET is_current = true WHERE id = p_year_id;
  RETURN FOUND;
END;
$$;

-- ============================================
-- STEP 3: Function to copy fee structure from one year to another
-- ============================================

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

  -- Copy fee structures from source year to target year
  INSERT INTO public.class_fee_structures (
    class_name,
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
    p_target_year_id,
    term,
    fee_category_id,
    amount,
    NULL, -- do not copy due dates
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM public.class_fee_structures
  WHERE academic_year_id = p_source_year_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- STEP 4: Grant execute permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.set_current_academic_year(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.copy_fee_structure(UUID, UUID) TO authenticated;

-- ============================================
-- STEP 5: Ensure at least one academic year exists and is marked current
-- ============================================

DO $$
DECLARE
  v_current_count INTEGER;
  v_any_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_current_count FROM public.academic_years WHERE is_current = true;
  
  IF v_current_count = 0 THEN
    -- Try to find 2026-2027 or most recent year and mark it current
    SELECT id INTO v_any_id FROM public.academic_years 
    ORDER BY start_date DESC LIMIT 1;
    
    IF v_any_id IS NOT NULL THEN
      UPDATE public.academic_years SET is_current = true WHERE id = v_any_id;
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 6: Ensure 2026-2027 academic year exists
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.academic_years WHERE year_name = '2026-2027') THEN
    INSERT INTO public.academic_years (year_name, start_date, end_date, is_current)
    VALUES ('2026-2027', '2026-04-01', '2027-03-31', false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

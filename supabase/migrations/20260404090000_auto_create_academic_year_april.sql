-- Auto-create academic year on April 1st each year
-- This migration creates a function to generate the next academic year
-- and seeds the 2026-2027 academic year since current date is April 2026

-- Function: auto-create next academic year if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_next_academic_year()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  current_year INT;
  next_year_name TEXT;
  next_start DATE;
  next_end DATE;
BEGIN
  -- Determine the next academic year based on current date
  -- Academic year runs April 1 to March 31
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;

  -- If today is April 1 or later, the new year starts this year
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
    next_year_name := current_year::TEXT || '-' || (current_year + 1)::TEXT;
    next_start := (current_year::TEXT || '-04-01')::DATE;
    next_end := ((current_year + 1)::TEXT || '-03-31')::DATE;
  ELSE
    next_year_name := (current_year - 1)::TEXT || '-' || current_year::TEXT;
    next_start := ((current_year - 1)::TEXT || '-04-01')::DATE;
    next_end := (current_year::TEXT || '-03-31')::DATE;
  END IF;

  -- Insert only if this academic year doesn't already exist
  INSERT INTO public.academic_years (id, year_name, start_date, end_date, is_current)
  VALUES (gen_random_uuid(), next_year_name, next_start, next_end, true)
  ON CONFLICT (year_name) DO NOTHING;

  -- Mark all other years as not current
  UPDATE public.academic_years
  SET is_current = false
  WHERE year_name != next_year_name;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'create_next_academic_year failed: %', SQLERRM;
END;
$func$;

-- Function: check and create academic year for April 1st trigger
CREATE OR REPLACE FUNCTION public.check_and_create_academic_year_on_april()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  today DATE := CURRENT_DATE;
  current_year INT := EXTRACT(YEAR FROM today)::INT;
  new_year_name TEXT;
  new_start DATE;
  new_end DATE;
BEGIN
  -- Only proceed if today is April 1st
  IF EXTRACT(MONTH FROM today) = 4 AND EXTRACT(DAY FROM today) = 1 THEN
    new_year_name := current_year::TEXT || '-' || (current_year + 1)::TEXT;
    new_start := (current_year::TEXT || '-04-01')::DATE;
    new_end := ((current_year + 1)::TEXT || '-03-31')::DATE;

    -- Insert new academic year if it doesn't exist
    INSERT INTO public.academic_years (id, year_name, start_date, end_date, is_current)
    VALUES (gen_random_uuid(), new_year_name, new_start, new_end, true)
    ON CONFLICT (year_name) DO NOTHING;

    -- Mark all other years as not current
    UPDATE public.academic_years
    SET is_current = false
    WHERE year_name != new_year_name;

    RAISE NOTICE 'Academic year % created/activated for April 1st', new_year_name;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'check_and_create_academic_year_on_april failed: %', SQLERRM;
END;
$func$;

-- Seed 2026-2027 academic year since current date is April 2026
-- This ensures the dropdown has the current year available immediately
DO $$
BEGIN
  INSERT INTO public.academic_years (id, year_name, start_date, end_date, is_current)
  VALUES
    (gen_random_uuid(), '2026-2027', '2026-04-01', '2027-03-31', true)
  ON CONFLICT (year_name) DO NOTHING;

  -- Mark 2025-2026 and older as not current
  UPDATE public.academic_years
  SET is_current = false
  WHERE year_name != '2026-2027';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed 2026-2027 failed: %', SQLERRM;
END $$;

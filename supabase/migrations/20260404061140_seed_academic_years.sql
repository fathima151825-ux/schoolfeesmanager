-- Seed academic years data so the parent dashboard dropdown has options

DO $$
BEGIN
  -- Insert academic years only if the table is empty
  IF NOT EXISTS (SELECT 1 FROM public.academic_years LIMIT 1) THEN
    INSERT INTO public.academic_years (id, year_name, start_date, end_date, is_current)
    VALUES
      (gen_random_uuid(), '2025-2026', '2025-06-01', '2026-03-31', true),
      (gen_random_uuid(), '2024-2025', '2024-06-01', '2025-03-31', false),
      (gen_random_uuid(), '2023-2024', '2023-06-01', '2024-03-31', false)
    ON CONFLICT (year_name) DO NOTHING;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Academic years seed failed: %', SQLERRM;
END $$;

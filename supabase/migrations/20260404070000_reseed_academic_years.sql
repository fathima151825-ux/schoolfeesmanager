-- Re-seed academic years unconditionally using ON CONFLICT DO NOTHING
-- This ensures data exists even if the previous seed migration was skipped

INSERT INTO public.academic_years (id, year_name, start_date, end_date, is_current)
VALUES
  (gen_random_uuid(), '2025-2026', '2025-06-01', '2026-03-31', true),
  (gen_random_uuid(), '2024-2025', '2024-06-01', '2025-03-31', false),
  (gen_random_uuid(), '2023-2024', '2023-06-01', '2024-03-31', false)
ON CONFLICT (year_name) DO NOTHING;

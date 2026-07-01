-- Fix student ADM2024001 date of birth
-- Console logs show: dbDate = '2010-05-15' but user enters 15/05/2015 (inputDate = '2015-05-15')
-- The student record has incorrect birth year (2010 instead of 2015)

UPDATE public.students
SET 
  date_of_birth = '2015-05-15',
  updated_at = CURRENT_TIMESTAMP
WHERE admission_number = 'ADM2024001';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.students WHERE admission_number = 'ADM2024001' AND date_of_birth = '2015-05-15') THEN
    RAISE NOTICE '✅ Student ADM2024001 date_of_birth updated to 2015-05-15 successfully';
  ELSE
    RAISE NOTICE '⚠️ Student ADM2024001 not found or update failed';
  END IF;
END $$;

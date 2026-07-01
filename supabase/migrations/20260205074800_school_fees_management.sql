-- SSVM School Fees Management System Migration
-- Supports 600+ students, fee structures, payments, and 3-year historical data

-- ============================================
-- STEP 1: ENUMS (Types)
-- ============================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'owner', 'parent');

DROP TYPE IF EXISTS public.payment_status CASCADE;
CREATE TYPE public.payment_status AS ENUM ('paid', 'partial', 'pending', 'overdue');

DROP TYPE IF EXISTS public.payment_method CASCADE;
CREATE TYPE public.payment_method AS ENUM ('online', 'cash', 'cheque');

DROP TYPE IF EXISTS public.transaction_status CASCADE;
CREATE TYPE public.transaction_status AS ENUM ('completed', 'failed', 'pending');

DROP TYPE IF EXISTS public.term_name CASCADE;
CREATE TYPE public.term_name AS ENUM ('term1', 'term2', 'term3');

-- ============================================
-- STEP 2: CORE TABLES
-- ============================================

-- User Profiles (Admin, Owner, Parent)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'parent'::public.user_role,
    mobile TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    date_of_joining DATE NOT NULL,
    aadhaar_number TEXT,
    community TEXT,
    blood_group TEXT,
    profile_image TEXT,
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Parent-Student Relationship
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    father_name TEXT NOT NULL,
    mother_name TEXT NOT NULL,
    father_mobile TEXT,
    mother_mobile TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, student_id)
);

-- Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_name TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Fee Categories (Tuition, Van, Book, Misc, Lab Caution)
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Fee Structure (Per Student, Per Academic Year, Per Term)
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term public.term_name NOT NULL,
    fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year_id, term, fee_category_id)
);

-- Payments Table (Transaction Records)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term public.term_name NOT NULL,
    fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    payment_status public.transaction_status DEFAULT 'completed'::public.transaction_status,
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    receipt_number TEXT NOT NULL UNIQUE,
    transaction_id TEXT,
    remarks TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Administrative Notes
CREATE TABLE IF NOT EXISTS public.administrative_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    added_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 3: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON public.students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON public.students(class, section);
CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON public.parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_student_id ON public.fee_structures(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_academic_year_id ON public.fee_structures(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_academic_year_id ON public.payments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_administrative_notes_student_id ON public.administrative_notes(student_id);

-- ============================================
-- STEP 4: FUNCTIONS
-- ============================================

-- Trigger function to create user_profiles from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, mobile)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent'::public.user_role),
        COALESCE(NEW.raw_user_meta_data->>'mobile', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Function to calculate student outstanding balance
CREATE OR REPLACE FUNCTION public.calculate_student_balance(
    p_student_id UUID,
    p_academic_year_id UUID
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    total_fees DECIMAL(10,2);
    total_paid DECIMAL(10,2);
BEGIN
    -- Calculate total fees
    SELECT COALESCE(SUM(amount), 0)
    INTO total_fees
    FROM public.fee_structures
    WHERE student_id = p_student_id
    AND academic_year_id = p_academic_year_id;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM public.payments
    WHERE student_id = p_student_id
    AND academic_year_id = p_academic_year_id
    AND payment_status = 'completed'::public.transaction_status;
    
    RETURN total_fees - total_paid;
END;
$$;

-- Function to get payment status for a student
CREATE OR REPLACE FUNCTION public.get_student_payment_status(
    p_student_id UUID,
    p_academic_year_id UUID
)
RETURNS public.payment_status
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    balance DECIMAL(10,2);
    total_fees DECIMAL(10,2);
    overdue_count INTEGER;
BEGIN
    -- Get balance
    balance := public.calculate_student_balance(p_student_id, p_academic_year_id);
    
    -- Get total fees
    SELECT COALESCE(SUM(amount), 0)
    INTO total_fees
    FROM public.fee_structures
    WHERE student_id = p_student_id
    AND academic_year_id = p_academic_year_id;
    
    -- Check for overdue payments
    SELECT COUNT(*)
    INTO overdue_count
    FROM public.fee_structures
    WHERE student_id = p_student_id
    AND academic_year_id = p_academic_year_id
    AND due_date < CURRENT_DATE
    AND amount > COALESCE((
        SELECT SUM(p.amount)
        FROM public.payments p
        WHERE p.student_id = fee_structures.student_id
        AND p.academic_year_id = fee_structures.academic_year_id
        AND p.term = fee_structures.term
        AND p.fee_category_id = fee_structures.fee_category_id
        AND p.payment_status = 'completed'::public.transaction_status
    ), 0);
    
    IF balance = 0 THEN
        RETURN 'paid'::public.payment_status;
    ELSIF overdue_count > 0 THEN
        RETURN 'overdue'::public.payment_status;
    ELSIF balance < total_fees THEN
        RETURN 'partial'::public.payment_status;
    ELSE
        RETURN 'pending'::public.payment_status;
    END IF;
END;
$$;

-- ============================================
-- STEP 5: ENABLE RLS
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: RLS POLICIES
-- ============================================

-- User Profiles: Users manage their own profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Students: Admin/Owner can manage all, Parents can view their children
DROP POLICY IF EXISTS "admin_manage_all_students" ON public.students;
CREATE POLICY "admin_manage_all_students"
ON public.students
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

DROP POLICY IF EXISTS "parents_view_own_students" ON public.students;
CREATE POLICY "parents_view_own_students"
ON public.students
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parent_students
        WHERE parent_students.student_id = students.id
        AND parent_students.parent_id = auth.uid()
    )
);

-- Parent-Student Relationships: Admin/Owner manage all, Parents view their own
DROP POLICY IF EXISTS "admin_manage_all_parent_students" ON public.parent_students;
CREATE POLICY "admin_manage_all_parent_students"
ON public.parent_students
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

DROP POLICY IF EXISTS "parents_view_own_parent_students" ON public.parent_students;
CREATE POLICY "parents_view_own_parent_students"
ON public.parent_students
FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

-- Academic Years: Public read access
DROP POLICY IF EXISTS "public_read_academic_years" ON public.academic_years;
CREATE POLICY "public_read_academic_years"
ON public.academic_years
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_manage_academic_years" ON public.academic_years;
CREATE POLICY "admin_manage_academic_years"
ON public.academic_years
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

-- Fee Categories: Public read access
DROP POLICY IF EXISTS "public_read_fee_categories" ON public.fee_categories;
CREATE POLICY "public_read_fee_categories"
ON public.fee_categories
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_manage_fee_categories" ON public.fee_categories;
CREATE POLICY "admin_manage_fee_categories"
ON public.fee_categories
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

-- Fee Structures: Admin/Owner manage all, Parents view their children's fees
DROP POLICY IF EXISTS "admin_manage_all_fee_structures" ON public.fee_structures;
CREATE POLICY "admin_manage_all_fee_structures"
ON public.fee_structures
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

DROP POLICY IF EXISTS "parents_view_own_fee_structures" ON public.fee_structures;
CREATE POLICY "parents_view_own_fee_structures"
ON public.fee_structures
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parent_students
        WHERE parent_students.student_id = fee_structures.student_id
        AND parent_students.parent_id = auth.uid()
    )
);

-- Payments: Admin/Owner manage all, Parents view their children's payments
DROP POLICY IF EXISTS "admin_manage_all_payments" ON public.payments;
CREATE POLICY "admin_manage_all_payments"
ON public.payments
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

DROP POLICY IF EXISTS "parents_view_own_payments" ON public.payments;
CREATE POLICY "parents_view_own_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parent_students
        WHERE parent_students.student_id = payments.student_id
        AND parent_students.parent_id = auth.uid()
    )
);

-- Administrative Notes: Admin/Owner only
DROP POLICY IF EXISTS "admin_manage_administrative_notes" ON public.administrative_notes;
CREATE POLICY "admin_manage_administrative_notes"
ON public.administrative_notes
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

-- ============================================
-- STEP 7: TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 8: MOCK DATA
-- ============================================

DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    owner_uuid UUID := gen_random_uuid();
    parent1_uuid UUID := gen_random_uuid();
    parent2_uuid UUID := gen_random_uuid();
    
    student1_uuid UUID := gen_random_uuid();
    student2_uuid UUID := gen_random_uuid();
    student3_uuid UUID := gen_random_uuid();
    student4_uuid UUID := gen_random_uuid();
    student5_uuid UUID := gen_random_uuid();
    
    year_2025_2026 UUID := gen_random_uuid();
    year_2024_2025 UUID := gen_random_uuid();
    year_2023_2024 UUID := gen_random_uuid();
    year_2022_2023 UUID := gen_random_uuid();
    
    cat_tuition UUID := gen_random_uuid();
    cat_van UUID := gen_random_uuid();
    cat_book UUID := gen_random_uuid();
    cat_misc UUID := gen_random_uuid();
    cat_lab UUID := gen_random_uuid();
BEGIN
    -- Create auth users (trigger creates user_profiles automatically)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@school', crypt('Admin@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Admin User', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (owner_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'owner@school', crypt('Owner@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Owner User', 'role', 'owner'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (parent1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'parent1@example.com', crypt('Parent@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Rajesh Kumar Sharma', 'role', 'parent', 'mobile', '+91 98765 43210'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (parent2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'parent2@example.com', crypt('Parent@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Amit Patel', 'role', 'parent', 'mobile', '+91 98765 43211'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Academic Years (4 years for 3-year historical data)
    INSERT INTO public.academic_years (id, year_name, start_date, end_date, is_current) VALUES
        (year_2025_2026, '2025-2026', '2025-04-01', '2026-03-31', true),
        (year_2024_2025, '2024-2025', '2024-04-01', '2025-03-31', false),
        (year_2023_2024, '2023-2024', '2023-04-01', '2024-03-31', false),
        (year_2022_2023, '2022-2023', '2022-04-01', '2023-03-31', false)
    ON CONFLICT (year_name) DO NOTHING;

    -- Fee Categories
    INSERT INTO public.fee_categories (id, name, description) VALUES
        (cat_tuition, 'Tuition Fees', 'Academic instruction fees'),
        (cat_van, 'Van Fees', 'Transportation charges'),
        (cat_book, 'Book Fees', 'Textbooks and study materials'),
        (cat_misc, 'Miscellaneous Fees', 'Sports, activities, and other charges'),
        (cat_lab, 'Lab Caution Deposit', 'Refundable deposit for lab equipment (Classes 9-12)')
    ON CONFLICT (id) DO NOTHING;

    -- Students (5 sample students)
    INSERT INTO public.students (id, admission_number, name, class, section, date_of_birth, date_of_joining, aadhaar_number, community, blood_group, attendance_percentage) VALUES
        (student1_uuid, 'ADM2024001', 'Aarav Kumar Sharma', '10', 'A', '2010-05-15', '2018-04-15', '1234 5678 9012', 'General', 'B+', 94.5),
        (student2_uuid, 'ADM2025002', 'Diya Patel', '9', 'B', '2011-08-20', '2019-04-10', '2345 6789 0123', 'OBC', 'A+', 92.0),
        (student3_uuid, 'ADM2025003', 'Arjun Kumar', '11', 'A', '2009-03-12', '2017-04-05', '3456 7890 1234', 'General', 'O+', 88.5),
        (student4_uuid, 'ADM2025004', 'Ananya Singh', '8', 'C', '2012-11-25', '2020-04-01', '4567 8901 2345', 'SC', 'AB+', 95.2),
        (student5_uuid, 'ADM2025005', 'Rohan Verma', '12', 'A', '2008-07-08', '2016-04-12', '5678 9012 3456', 'General', 'B-', 90.8)
    ON CONFLICT (admission_number) DO NOTHING;

    -- Parent-Student Relationships
    INSERT INTO public.parent_students (parent_id, student_id, father_name, mother_name, father_mobile, mother_mobile, address) VALUES
        (parent1_uuid, student1_uuid, 'Rajesh Kumar Sharma', 'Priya Sharma', '+91 98765 43210', '+91 98765 43211', 'House No. 45, Sector 12, Vasant Vihar, New Delhi - 110057, India'),
        (parent2_uuid, student2_uuid, 'Amit Patel', 'Neha Patel', '+91 98765 43211', '+91 98765 43212', 'Plot No. 23, Green Park, Mumbai - 400001, India')
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- Fee Structures for Student 1 (ADM2024001) - Current Year 2025-2026
    INSERT INTO public.fee_structures (student_id, academic_year_id, term, fee_category_id, amount, due_date) VALUES
        (student1_uuid, year_2025_2026, 'term1'::public.term_name, cat_tuition, 30000, '2025-06-30'),
        (student1_uuid, year_2025_2026, 'term1'::public.term_name, cat_van, 10000, '2025-06-30'),
        (student1_uuid, year_2025_2026, 'term1'::public.term_name, cat_book, 5000, '2025-06-30'),
        (student1_uuid, year_2025_2026, 'term2'::public.term_name, cat_tuition, 30000, '2025-10-31'),
        (student1_uuid, year_2025_2026, 'term2'::public.term_name, cat_van, 10000, '2025-10-31'),
        (student1_uuid, year_2025_2026, 'term3'::public.term_name, cat_tuition, 30000, '2026-02-28'),
        (student1_uuid, year_2025_2026, 'term3'::public.term_name, cat_van, 10000, '2026-02-28')
    ON CONFLICT (student_id, academic_year_id, term, fee_category_id) DO NOTHING;

    -- Fee Structures for Student 1 - Previous Years (2024-2025, 2023-2024, 2022-2023)
    INSERT INTO public.fee_structures (student_id, academic_year_id, term, fee_category_id, amount, due_date) VALUES
        -- 2024-2025
        (student1_uuid, year_2024_2025, 'term1'::public.term_name, cat_tuition, 28000, '2024-06-30'),
        (student1_uuid, year_2024_2025, 'term1'::public.term_name, cat_van, 9000, '2024-06-30'),
        (student1_uuid, year_2024_2025, 'term2'::public.term_name, cat_tuition, 28000, '2024-10-31'),
        (student1_uuid, year_2024_2025, 'term2'::public.term_name, cat_van, 9000, '2024-10-31'),
        (student1_uuid, year_2024_2025, 'term3'::public.term_name, cat_tuition, 28000, '2025-02-28'),
        (student1_uuid, year_2024_2025, 'term3'::public.term_name, cat_van, 9000, '2025-02-28'),
        -- 2023-2024
        (student1_uuid, year_2023_2024, 'term1'::public.term_name, cat_tuition, 26000, '2023-06-30'),
        (student1_uuid, year_2023_2024, 'term1'::public.term_name, cat_van, 8000, '2023-06-30'),
        (student1_uuid, year_2023_2024, 'term2'::public.term_name, cat_tuition, 26000, '2023-10-31'),
        (student1_uuid, year_2023_2024, 'term2'::public.term_name, cat_van, 8000, '2023-10-31'),
        (student1_uuid, year_2023_2024, 'term3'::public.term_name, cat_tuition, 26000, '2024-02-29'),
        (student1_uuid, year_2023_2024, 'term3'::public.term_name, cat_van, 8000, '2024-02-29'),
        -- 2022-2023
        (student1_uuid, year_2022_2023, 'term1'::public.term_name, cat_tuition, 24000, '2022-06-30'),
        (student1_uuid, year_2022_2023, 'term1'::public.term_name, cat_van, 7000, '2022-06-30'),
        (student1_uuid, year_2022_2023, 'term2'::public.term_name, cat_tuition, 24000, '2022-10-31'),
        (student1_uuid, year_2022_2023, 'term2'::public.term_name, cat_van, 7000, '2022-10-31'),
        (student1_uuid, year_2022_2023, 'term3'::public.term_name, cat_tuition, 24000, '2023-02-28'),
        (student1_uuid, year_2022_2023, 'term3'::public.term_name, cat_van, 7000, '2023-02-28')
    ON CONFLICT (student_id, academic_year_id, term, fee_category_id) DO NOTHING;

    -- Payments for Student 1 - Current Year (Term 1 & 2 Paid)
    INSERT INTO public.payments (student_id, academic_year_id, term, fee_category_id, amount, payment_method, payment_status, payment_date, receipt_number, transaction_id, recorded_by) VALUES
        (student1_uuid, year_2025_2026, 'term1'::public.term_name, cat_tuition, 30000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2025-06-25 14:15:30', 'RCP/2025/0156', 'TXN20250625141530', admin_uuid),
        (student1_uuid, year_2025_2026, 'term1'::public.term_name, cat_van, 10000, 'cheque'::public.payment_method, 'completed'::public.transaction_status, '2025-06-25 14:30:00', 'RCP/2025/0157', 'CHQ456789', admin_uuid),
        (student1_uuid, year_2025_2026, 'term1'::public.term_name, cat_book, 5000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2025-06-25 14:45:00', 'RCP/2025/0158', null, admin_uuid),
        (student1_uuid, year_2025_2026, 'term2'::public.term_name, cat_tuition, 30000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2025-10-15 10:30:00', 'RCP/2025/0234', 'TXN20251015103045', admin_uuid),
        (student1_uuid, year_2025_2026, 'term2'::public.term_name, cat_van, 10000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2025-10-15 11:00:00', 'RCP/2025/0235', null, admin_uuid)
    ON CONFLICT (receipt_number) DO NOTHING;

    -- Payments for Student 1 - Previous Years (All Paid)
    INSERT INTO public.payments (student_id, academic_year_id, term, fee_category_id, amount, payment_method, payment_status, payment_date, receipt_number, transaction_id, recorded_by) VALUES
        -- 2024-2025
        (student1_uuid, year_2024_2025, 'term1'::public.term_name, cat_tuition, 28000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2024-06-20 10:00:00', 'RCP/2024/0145', 'TXN20240620100000', admin_uuid),
        (student1_uuid, year_2024_2025, 'term1'::public.term_name, cat_van, 9000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2024-06-20 10:30:00', 'RCP/2024/0146', null, admin_uuid),
        (student1_uuid, year_2024_2025, 'term2'::public.term_name, cat_tuition, 28000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2024-10-18 09:15:00', 'RCP/2024/0234', 'TXN20241018091500', admin_uuid),
        (student1_uuid, year_2024_2025, 'term2'::public.term_name, cat_van, 9000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2024-10-18 09:45:00', 'RCP/2024/0235', null, admin_uuid),
        (student1_uuid, year_2024_2025, 'term3'::public.term_name, cat_tuition, 28000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2025-02-15 11:20:00', 'RCP/2025/0045', 'TXN20250215112000', admin_uuid),
        (student1_uuid, year_2024_2025, 'term3'::public.term_name, cat_van, 9000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2025-02-15 11:50:00', 'RCP/2025/0046', null, admin_uuid),
        -- 2023-2024
        (student1_uuid, year_2023_2024, 'term1'::public.term_name, cat_tuition, 26000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2023-06-22 14:00:00', 'RCP/2023/0167', 'TXN20230622140000', admin_uuid),
        (student1_uuid, year_2023_2024, 'term1'::public.term_name, cat_van, 8000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2023-06-22 14:30:00', 'RCP/2023/0168', null, admin_uuid),
        (student1_uuid, year_2023_2024, 'term2'::public.term_name, cat_tuition, 26000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2023-10-20 10:45:00', 'RCP/2023/0256', 'TXN20231020104500', admin_uuid),
        (student1_uuid, year_2023_2024, 'term2'::public.term_name, cat_van, 8000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2023-10-20 11:15:00', 'RCP/2023/0257', null, admin_uuid),
        (student1_uuid, year_2023_2024, 'term3'::public.term_name, cat_tuition, 26000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2024-02-18 09:30:00', 'RCP/2024/0034', 'TXN20240218093000', admin_uuid),
        (student1_uuid, year_2023_2024, 'term3'::public.term_name, cat_van, 8000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2024-02-18 10:00:00', 'RCP/2024/0035', null, admin_uuid),
        -- 2022-2023
        (student1_uuid, year_2022_2023, 'term1'::public.term_name, cat_tuition, 24000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2022-06-25 13:00:00', 'RCP/2022/0189', 'TXN20220625130000', admin_uuid),
        (student1_uuid, year_2022_2023, 'term1'::public.term_name, cat_van, 7000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2022-06-25 13:30:00', 'RCP/2022/0190', null, admin_uuid),
        (student1_uuid, year_2022_2023, 'term2'::public.term_name, cat_tuition, 24000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2022-10-22 11:00:00', 'RCP/2022/0278', 'TXN20221022110000', admin_uuid),
        (student1_uuid, year_2022_2023, 'term2'::public.term_name, cat_van, 7000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2022-10-22 11:30:00', 'RCP/2022/0279', null, admin_uuid),
        (student1_uuid, year_2022_2023, 'term3'::public.term_name, cat_tuition, 24000, 'online'::public.payment_method, 'completed'::public.transaction_status, '2023-02-20 10:15:00', 'RCP/2023/0023', 'TXN20230220101500', admin_uuid),
        (student1_uuid, year_2022_2023, 'term3'::public.term_name, cat_van, 7000, 'cash'::public.payment_method, 'completed'::public.transaction_status, '2023-02-20 10:45:00', 'RCP/2023/0024', null, admin_uuid)
    ON CONFLICT (receipt_number) DO NOTHING;

    -- Administrative Notes
    INSERT INTO public.administrative_notes (student_id, content, added_by, is_important) VALUES
        (student1_uuid, 'Student has shown excellent academic performance throughout the year. Recommended for merit scholarship consideration.', admin_uuid, true),
        (student1_uuid, 'Parent requested installment plan for Term 3 fees. Approved by management.', admin_uuid, false)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Mock data created successfully for SSVM School Fees Management System';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
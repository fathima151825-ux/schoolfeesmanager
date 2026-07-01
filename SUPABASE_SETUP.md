# SSVM School Fees Management - Supabase Setup Guide

## Database Migration

The database schema has been created in `supabase/migrations/20260205074800_school_fees_management.sql`.

### To apply the migration:

1. **Go to your Supabase Dashboard** (https://app.supabase.com)
2. **Select your project**
3. **Navigate to SQL Editor** (left sidebar)
4. **Copy the entire contents** of `supabase/migrations/20260205074800_school_fees_management.sql`
5. **Paste into the SQL Editor**
6. **Click "Run"** to execute the migration

### What the migration creates:

- **8 Tables**: user_profiles, students, parent_students, academic_years, fee_categories, fee_structures, payments, administrative_notes
- **5 ENUMs**: user_role, payment_status, payment_method, transaction_status, term_name
- **RLS Policies**: Role-based access control for admin, owner, and parent users
- **Functions**: Automatic user profile creation, balance calculation, payment status determination
- **Mock Data**: 5 sample students with 3-year historical payment data

## Demo Login Credentials

### Admin Login (Email/Password)
- **Email**: admin@school
- **Password**: Admin@2026
- **Role**: Admin

### Owner Login (Email/Password)
- **Email**: owner@school
- **Password**: Owner@2026
- **Role**: Owner

### Parent Login (Admission Number/Date of Birth)
- **Admission Number**: ADM2024001
- **Date of Birth**: 2010-05-15
- **Student**: Aarav Kumar Sharma (Class 10-A)

## Environment Variables

Your `.env` file already contains the Supabase configuration:

```
VITE_SUPABASE_URL=https://dummy.supabase.co
VITE_SUPABASE_ANON_KEY=dummykey.updateyourkkey.here
```

**IMPORTANT**: Replace these with your actual Supabase project credentials:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and replace `VITE_SUPABASE_URL`
4. Copy your **anon/public key** and replace `VITE_SUPABASE_ANON_KEY`

## Database Schema Overview

### Core Tables:

1. **user_profiles**: Admin, Owner, and Parent user accounts
2. **students**: Student records with admission details
3. **parent_students**: Links parents to their children
4. **academic_years**: Academic year definitions (2022-2026)
5. **fee_categories**: Fee types (Tuition, Van, Book, Misc, Lab)
6. **fee_structures**: Fee amounts per student/term/category
7. **payments**: Payment transaction records
8. **administrative_notes**: Admin notes for students

### Key Features:

- **3-Year Historical Data**: Mock data includes payments from 2022-2023 to 2025-2026
- **Role-Based Access**: Admins see all data, parents see only their children's data
- **Automatic Balance Calculation**: Database functions calculate outstanding balances
- **Payment Status Tracking**: Automatically determines paid/partial/pending/overdue status
- **Term-Based Fee Structure**: 3 terms per year with multiple fee categories

## Testing the Integration

1. **Run the migration** in Supabase SQL Editor
2. **Update environment variables** with your Supabase credentials
3. **Restart the development server**
4. **Login as Admin** to view all 5 students with payment data
5. **Login as Parent** to view student-specific fee and payment information

## Data Scalability

The system is designed to handle 600+ students:

- **Indexed columns**: admission_number, class, section, payment_date
- **Efficient queries**: Uses database functions for calculations
- **Pagination ready**: Service layer supports limit/offset queries
- **Historical data**: Maintains 3+ years of payment records per student

## Support

If you encounter any issues:

1. Check that the migration ran successfully (no SQL errors)
2. Verify environment variables are set correctly
3. Ensure Supabase project is active and accessible
4. Check browser console for any authentication errors

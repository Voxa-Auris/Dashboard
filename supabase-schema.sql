-- Voxa Auris Dashboard Database Schema
-- Run this in Supabase SQL Editor: https://tsayxwcckrsawwtloxed.supabase.co/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'client', -- 'admin' or 'client'
  client_id UUID, -- NULL for admins, foreign key for clients
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table (companies using Voxa Auris)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  plan_type TEXT DEFAULT 'starter', -- 'starter', 'professional', 'enterprise'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'trial'
  total_minutes_used INTEGER DEFAULT 0,
  monthly_minute_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Calls table (record of all calls made)
CREATE TABLE IF NOT EXISTS public.ai_calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  agent_name TEXT NOT NULL, -- 'Alexander' or 'Olivia'
  lead_name TEXT,
  lead_phone TEXT NOT NULL,
  lead_email TEXT,
  call_duration_seconds INTEGER DEFAULT 0,
  call_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'scheduled'
  call_outcome TEXT, -- 'appointment_scheduled', 'callback_requested', 'not_interested', etc.
  appointment_date TIMESTAMPTZ,
  call_recording_url TEXT,
  transcript TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Call minutes tracking (for real-time usage)
CREATE TABLE IF NOT EXISTS public.call_minutes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  call_id UUID REFERENCES public.ai_calls(id) ON DELETE CASCADE,
  minutes_used DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  billing_period TEXT, -- 'YYYY-MM' format
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for profiles.client_id
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_client_id ON public.ai_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_created_at ON public.ai_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_minutes_client_id ON public.call_minutes(client_id);
CREATE INDEX IF NOT EXISTS idx_call_minutes_billing_period ON public.call_minutes(billing_period);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_minutes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for clients
CREATE POLICY "Admins can view all clients"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view own client record"
  ON public.clients FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- RLS Policies for ai_calls
CREATE POLICY "Admins can view all calls"
  ON public.ai_calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view own calls"
  ON public.ai_calls FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- RLS Policies for call_minutes
CREATE POLICY "Admins can view all call minutes"
  ON public.call_minutes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view own call minutes"
  ON public.call_minutes FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert seed data: Create your admin account
-- IMPORTANT: Change this email to your Voxa Auris admin email!
-- This will be run AFTER you create your first user via the signup page

-- Example: If you sign up with admin@voxa-auris.com, run this:
-- UPDATE public.profiles SET role = 'admin', client_id = NULL WHERE email = 'admin@voxa-auris.com';

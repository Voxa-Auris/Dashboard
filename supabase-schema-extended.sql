-- Voxa Auris Dashboard - Extended Schema
-- Run this AFTER the base schema (supabase-schema.sql)
-- This adds plans, agents, and extends existing tables

-- Plans table (subscription tiers)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  included_cost_eur DECIMAL(10, 2) NOT NULL DEFAULT 250,
  rate_eur_per_min DECIMAL(10, 4) NOT NULL DEFAULT 0.20,
  overage_markup DECIMAL(5, 2) NOT NULL DEFAULT 1.0, -- 1.0 = 100% markup (2x price)
  reset_day INTEGER NOT NULL DEFAULT 1, -- Day of month (1-28)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table (Alexander, Olivia, etc.)
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  voice TEXT, -- e.g. "male-dutch" or ElevenLabs voice ID
  model TEXT, -- e.g. "gpt-4" or AI provider
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- NULL = global agent
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source TEXT NOT NULL, -- e.g. "n8n", "elevenlabs", "vapi"
  endpoint TEXT, -- which webhook endpoint was called
  status TEXT NOT NULL, -- "success", "failed", "retry"
  status_code INTEGER, -- HTTP status
  latency_ms INTEGER, -- response time
  retries INTEGER DEFAULT 0,
  payload_hash TEXT, -- for deduplication
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend clients table with new fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS custom_rate_eur_per_min DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS custom_included_cost_eur DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS avg_deal_value DECIMAL(10, 2), -- For revenue estimation
  ADD COLUMN IF NOT EXISTS crm_type TEXT, -- "hubspot", "pipedrive", etc.
  ADD COLUMN IF NOT EXISTS crm_account_id TEXT;

-- Extend ai_calls table with new fields
ALTER TABLE public.ai_calls
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound', -- "inbound" or "outbound"
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'outbound', -- "inbound", "outbound", "coldcall"
  ADD COLUMN IF NOT EXISTS response_time_sec INTEGER, -- Time from lead to first call
  ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3, 2), -- 0.0 to 1.0 (future: OpenAI analysis)
  ADD COLUMN IF NOT EXISTS cost_eur DECIMAL(10, 4); -- Calculated cost for this call

-- Rename agent_name to agent_id (if needed) and add FK
-- First check if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='ai_calls' AND column_name='agent_name') THEN
    ALTER TABLE public.ai_calls RENAME COLUMN agent_name TO agent_name_old;
  END IF;
END $$;

ALTER TABLE public.ai_calls
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_client_id ON public.agents(client_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_clients_plan_id ON public.clients(plan_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_agent_id ON public.ai_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_response_time ON public.ai_calls(response_time_sec);

-- Enable RLS for new tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans (everyone can view)
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);

-- RLS Policies for agents
CREATE POLICY "Admins can view all agents" ON public.agents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Clients can view own agents" ON public.agents FOR SELECT
  USING (
    client_id IN (SELECT client_id FROM public.profiles WHERE profiles.id = auth.uid())
    OR client_id IS NULL -- Global agents visible to all
  );

-- RLS Policies for webhook_logs (admin only)
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Trigger for updated_at on new tables
CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_agents
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default plans
INSERT INTO public.plans (name, included_cost_eur, rate_eur_per_min, overage_markup, reset_day)
VALUES
  ('Starter', 150, 0.20, 1.0, 1),
  ('Professional', 250, 0.20, 1.0, 1),
  ('Enterprise', 500, 0.18, 0.5, 1)
ON CONFLICT (name) DO NOTHING;

-- Create Voxa Auris internal client (your own company)
INSERT INTO public.clients (
  id,
  company_name,
  contact_email,
  contact_phone,
  plan_id,
  status,
  total_minutes_used,
  monthly_minute_limit,
  avg_deal_value
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Voxa Auris (Internal)',
  'sales@voxa-auris.com',
  '+31612345678',
  (SELECT id FROM public.plans WHERE name = 'Enterprise'),
  'active',
  0,
  10000, -- 10k minutes
  500 -- Average deal value €500
)
ON CONFLICT (id) DO NOTHING;

-- Create Alexander & Olivia agents
INSERT INTO public.agents (id, name, voice, model, client_id, active)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Alexander',
    'male-dutch-professional',
    'gpt-4',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    'Olivia',
    'female-dutch-friendly',
    'gpt-4',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Create some demo calls for Voxa Auris (so you have data to see)
INSERT INTO public.ai_calls (
  client_id,
  agent_id,
  lead_name,
  lead_phone,
  lead_email,
  call_duration_seconds,
  call_status,
  call_outcome,
  direction,
  type,
  response_time_sec,
  sentiment_score,
  created_at,
  completed_at,
  cost_eur
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  CASE WHEN i % 2 = 0 THEN '10000000-0000-0000-0000-000000000001'::uuid ELSE '10000000-0000-0000-0000-000000000002'::uuid END,
  'Demo Lead ' || i,
  '+3161234' || LPAD(i::text, 4, '0'),
  'lead' || i || '@example.com',
  60 + (i * 30) % 300, -- 60-360 seconds
  CASE WHEN i % 5 = 0 THEN 'failed' ELSE 'completed' END,
  CASE
    WHEN i % 3 = 0 THEN 'appointment'
    WHEN i % 3 = 1 THEN 'qualified'
    ELSE 'not_interested'
  END,
  CASE WHEN i % 3 = 0 THEN 'inbound' ELSE 'outbound' END,
  CASE WHEN i % 4 = 0 THEN 'coldcall' ELSE 'outbound' END,
  (30 + (i * 10) % 180), -- 30-210 seconds response time
  0.5 + (RANDOM() * 0.5), -- 0.5-1.0 sentiment
  NOW() - (i || ' hours')::INTERVAL,
  NOW() - (i || ' hours')::INTERVAL + ((60 + (i * 30) % 300) || ' seconds')::INTERVAL,
  ((60 + (i * 30) % 300) / 60.0 * 0.20)::decimal(10,4) -- Cost based on duration
FROM generate_series(1, 30) i
ON CONFLICT DO NOTHING;

-- Update Voxa Auris total minutes used
UPDATE public.clients
SET total_minutes_used = (
  SELECT COALESCE(SUM(call_duration_seconds), 0) / 60
  FROM public.ai_calls
  WHERE client_id = '00000000-0000-0000-0000-000000000001'::uuid
)
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Extended schema created successfully!';
  RAISE NOTICE 'Plans: Starter, Professional, Enterprise';
  RAISE NOTICE 'Client: Voxa Auris (Internal)';
  RAISE NOTICE 'Agents: Alexander & Olivia';
  RAISE NOTICE 'Demo calls: 30 sample calls created';
END $$;

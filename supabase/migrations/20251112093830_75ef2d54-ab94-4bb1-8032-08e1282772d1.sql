-- Create anonymous pattern data table
CREATE TABLE public.anonymous_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash TEXT NOT NULL,
  pattern_signature TEXT NOT NULL,
  depth INTEGER NOT NULL,
  mutation_rate NUMERIC NOT NULL,
  achievement_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create archetype stats table
CREATE TABLE public.archetype_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_sessions INTEGER DEFAULT 0,
  diver_count INTEGER DEFAULT 0,
  cycler_count INTEGER DEFAULT 0,
  explorer_count INTEGER DEFAULT 0,
  repeater_count INTEGER DEFAULT 0,
  drifter_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initialize archetype stats with a single row
INSERT INTO public.archetype_stats (total_sessions) VALUES (0);

-- Enable RLS (but make it public for anonymous data)
ALTER TABLE public.anonymous_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetype_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert anonymous patterns
CREATE POLICY "Anyone can insert anonymous patterns"
ON public.anonymous_patterns
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to read archetype stats
CREATE POLICY "Anyone can read archetype stats"
ON public.archetype_stats
FOR SELECT
TO anon, authenticated
USING (true);

-- Create indexes for performance
CREATE INDEX idx_anonymous_patterns_session ON public.anonymous_patterns(session_hash);
CREATE INDEX idx_anonymous_patterns_depth ON public.anonymous_patterns(depth);
CREATE INDEX idx_anonymous_patterns_created ON public.anonymous_patterns(created_at);

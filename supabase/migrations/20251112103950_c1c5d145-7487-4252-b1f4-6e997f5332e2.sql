-- Create sessions table for authenticated users
CREATE TABLE public.recursion_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  depth integer NOT NULL DEFAULT 0,
  pattern jsonb NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create patterns table for session history
CREATE TABLE public.recursion_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.recursion_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern jsonb NOT NULL,
  depth integer NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.recursion_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.recursion_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Create constellation archives (premium only)
CREATE TABLE public.constellation_archives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.recursion_sessions(id) ON DELETE CASCADE,
  svg_data text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recursion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursion_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursion_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constellation_archives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions"
  ON public.recursion_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.recursion_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.recursion_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for patterns
CREATE POLICY "Users can view their own patterns"
  ON public.recursion_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns"
  ON public.recursion_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements"
  ON public.recursion_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.recursion_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for constellation archives (premium only)
CREATE POLICY "Premium users can view their archives"
  ON public.constellation_archives FOR SELECT
  USING (auth.uid() = user_id AND public.has_premium(auth.uid()));

CREATE POLICY "Premium users can insert archives"
  ON public.constellation_archives FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_premium(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_recursion_sessions_user_id ON public.recursion_sessions(user_id);
CREATE INDEX idx_recursion_patterns_session_id ON public.recursion_patterns(session_id);
CREATE INDEX idx_recursion_patterns_user_id ON public.recursion_patterns(user_id);
CREATE INDEX idx_recursion_achievements_session_id ON public.recursion_achievements(session_id);
CREATE INDEX idx_constellation_archives_user_id ON public.constellation_archives(user_id);
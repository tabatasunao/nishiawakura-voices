-- Questions
CREATE TABLE public.questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number              INTEGER,
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  title_en_cache      TEXT,
  body_en_cache       TEXT,
  category            TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','proposed','archived','selected')),
  vote_count          INTEGER NOT NULL DEFAULT 0,
  resident_vote_count INTEGER NOT NULL DEFAULT 0,
  proposed_by_session UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes (one per session per question)
CREATE TABLE public.votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL,
  is_resident BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, session_id)
);

-- Comments
CREATE TABLE public.comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL,
  display_name  TEXT,
  is_resident   BOOLEAN NOT NULL DEFAULT FALSE,
  body          TEXT NOT NULL,
  body_en_cache TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (reads are public; writes go through server actions with service role)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_public" ON public.questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "votes_select_public"     ON public.votes    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comments_select_public"  ON public.comments FOR SELECT TO anon, authenticated USING (true);

-- Trigger: update cached vote counts on insert / delete
CREATE OR REPLACE FUNCTION public.update_vote_counts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions SET
      vote_count          = vote_count + 1,
      resident_vote_count = resident_vote_count + (CASE WHEN NEW.is_resident THEN 1 ELSE 0 END)
    WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions SET
      vote_count          = GREATEST(vote_count - 1, 0),
      resident_vote_count = GREATEST(resident_vote_count - (CASE WHEN OLD.is_resident THEN 1 ELSE 0 END), 0)
    WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_vote_counts();

-- Realtime on questions (for live vote count updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;

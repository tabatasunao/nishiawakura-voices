-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  is_resident  BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  proposed_by         UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes (one per user per question)
CREATE TABLE public.votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Comments
CREATE TABLE public.comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  body_en_cache TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ── Profiles policies ──────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ── Questions policies ─────────────────────────────────────────────────────────
CREATE POLICY "questions_select_public"
  ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "questions_insert_proposed"
  ON public.questions FOR INSERT TO authenticated
  WITH CHECK (
    status = 'proposed' AND
    (SELECT auth.uid()) = proposed_by
  );

CREATE POLICY "questions_update_admin"
  ON public.questions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
  ));

CREATE POLICY "questions_delete_admin"
  ON public.questions FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
  ));

-- ── Votes policies ─────────────────────────────────────────────────────────────
CREATE POLICY "votes_select_public"
  ON public.votes FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "votes_insert_authenticated"
  ON public.votes FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "votes_delete_own"
  ON public.votes FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ── Comments policies ──────────────────────────────────────────────────────────
CREATE POLICY "comments_select_public"
  ON public.comments FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "comments_insert_authenticated"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "comments_delete_admin"
  ON public.comments FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
  ));

-- ── Auto-create profile on signup ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Update cached vote counts on insert/delete ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_vote_counts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_resident BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT is_resident INTO v_is_resident FROM public.profiles WHERE id = NEW.user_id;
    UPDATE public.questions SET
      vote_count          = vote_count + 1,
      resident_vote_count = resident_vote_count + (CASE WHEN v_is_resident THEN 1 ELSE 0 END)
    WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT is_resident INTO v_is_resident FROM public.profiles WHERE id = OLD.user_id;
    UPDATE public.questions SET
      vote_count          = GREATEST(vote_count - 1, 0),
      resident_vote_count = GREATEST(resident_vote_count - (CASE WHEN v_is_resident THEN 1 ELSE 0 END), 0)
    WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_vote_counts();

-- ── Realtime ───────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;

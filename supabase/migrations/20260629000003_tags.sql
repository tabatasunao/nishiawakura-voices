-- Replace single `category` column with a `tags` array that supports
-- both predefined tags and free-form user-defined tags.

ALTER TABLE public.questions
  ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing category values to the first element of the new array
UPDATE public.questions SET tags = ARRAY[category];

ALTER TABLE public.questions DROP COLUMN category;

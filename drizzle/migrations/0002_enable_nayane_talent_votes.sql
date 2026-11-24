ALTER TABLE public.canta_votes DROP CONSTRAINT canta_votes_talent_id_check;
ALTER TABLE public.canta_votes ADD CONSTRAINT canta_votes_talent_id_check CHECK (talent_id >= 1 AND talent_id <= 7);
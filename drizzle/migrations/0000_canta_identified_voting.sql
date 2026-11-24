CREATE TABLE public.canta_voter_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token_hash text NOT NULL UNIQUE,
 name text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
 email text NOT NULL CHECK (length(email) <= 254 AND email = lower(email) AND split_part(email, '@', 2) IN ('canta.ag', 'cantacom.com.br')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT '2026-12-10 03:00:00+00'
);
GRANT ALL ON public.canta_voter_sessions TO service_role;
ALTER TABLE public.canta_voter_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.canta_votes (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 session_id uuid NOT NULL REFERENCES public.canta_voter_sessions(id),
 voter_name text NOT NULL CHECK (length(voter_name) BETWEEN 2 AND 100),
 voter_email text NOT NULL CHECK (length(voter_email) <= 254 AND voter_email = lower(voter_email) AND split_part(voter_email, '@', 2) IN ('canta.ag', 'cantacom.com.br')),
 talent_id integer NOT NULL CHECK (talent_id BETWEEN 1 AND 6),
 created_at timestamptz NOT NULL DEFAULT now(),
 sheet_synced_at timestamptz,
 UNIQUE(voter_email, talent_id)
);
GRANT ALL ON public.canta_votes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.canta_votes_id_seq TO service_role;
ALTER TABLE public.canta_votes ENABLE ROW LEVEL SECURITY;
CREATE INDEX canta_votes_pending ON public.canta_votes(id) WHERE sheet_synced_at IS NULL;

CREATE FUNCTION public.canta_enforce_vote_deadline() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF now() >= timestamptz '2026-12-10 03:00:00+00' THEN
  RAISE EXCEPTION 'A votação foi encerrada em 09/12/2026.';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER canta_vote_deadline BEFORE INSERT ON public.canta_votes FOR EACH ROW EXECUTE FUNCTION public.canta_enforce_vote_deadline();

CREATE FUNCTION public.canta_vote_totals() RETURNS TABLE(talent_id integer, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT talent_id, count(*) FROM public.canta_votes GROUP BY talent_id;
$$;
REVOKE ALL ON FUNCTION public.canta_vote_totals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.canta_vote_totals() TO anon, authenticated, service_role;
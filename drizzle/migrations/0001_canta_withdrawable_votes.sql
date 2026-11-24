ALTER TABLE public.canta_votes ADD COLUMN withdrawn_at timestamptz;
ALTER TABLE public.canta_votes ADD COLUMN sheet_revision bigint NOT NULL DEFAULT 1;
CREATE OR REPLACE FUNCTION public.canta_vote_totals()
RETURNS TABLE(talent_id integer, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT v.talent_id, count(*) FROM public.canta_votes v WHERE v.withdrawn_at IS NULL GROUP BY v.talent_id; $$;
REVOKE ALL ON FUNCTION public.canta_vote_totals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.canta_vote_totals() TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.canta_track_vote_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.withdrawn_at IS DISTINCT FROM OLD.withdrawn_at THEN
  IF now() >= timestamptz '2026-12-10 03:00:00+00' THEN
   RAISE EXCEPTION 'A votação foi encerrada em 09/12/2026.';
  END IF;
  NEW.sheet_synced_at := NULL;
  NEW.sheet_revision := OLD.sheet_revision + 1;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.canta_track_vote_change() FROM PUBLIC;
CREATE TRIGGER canta_track_vote_change BEFORE UPDATE OF withdrawn_at ON public.canta_votes FOR EACH ROW EXECUTE FUNCTION public.canta_track_vote_change();
COMMENT ON COLUMN public.canta_votes.withdrawn_at IS 'Soft withdrawal keeps immutable spreadsheet row IDs and supports retrying canceled exports.';
COMMENT ON COLUMN public.canta_votes.sheet_revision IS 'Incremented for voting state changes so stale exports cannot mark newer changes synchronized.';
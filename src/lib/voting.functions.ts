import { createServerFn } from '@tanstack/react-start';
import { getCookie, getRequestUrl, setCookie, deleteCookie, setResponseHeader } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import talents from '@/data/talents.json';
import { voterSchema, isVotingOpen, VOTING_CLOSES_AT } from './voting-rules';
import { voterCookieOptions } from './voting-session';

const COOKIE = 'canta_voter';

export const registerVoter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => voterSchema.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    if (!isVotingOpen(new Date())) throw new Error('A votação foi encerrada em 09/12/2026.');
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
    // Registration is deliberately public and self-declared, not a verified account login.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('canta_voter_sessions').insert({ ...data, token_hash: hash });
    if (error) throw new Error('Não foi possível registrar sua identificação. Tente novamente.');
    setCookie(COOKIE, token, { ...voterCookieOptions(getRequestUrl({ xForwardedProto: true })), expires: new Date(VOTING_CLOSES_AT) });
    return { ok: true };
  });

export const getVotingState = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeader('Cache-Control', 'no-store');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Votação temporariamente indisponível.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
  const totals = await client.rpc('canta_vote_totals');
  if (totals.error) throw new Error('Não foi possível carregar os votos.');
  const counts: Record<number, number> = Object.fromEntries((totals.data ?? []).map(row => [row.talent_id, Number(row.total)]));
  const base = { counts, open: isVotingOpen(new Date()) };
  const token = getCookie(COOKIE);
  if (!token || token.length !== 72) return { ...base, voter: null, votedIds: [] as number[] };
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const session = await supabaseAdmin.from('canta_voter_sessions').select('id,name,email,expires_at').eq('token_hash', hash).maybeSingle();
  if (session.error) throw new Error('Não foi possível consultar sua identificação.');
  if (!session.data || new Date(session.data.expires_at) <= new Date()) return { ...base, voter: null, votedIds: [] as number[] };
  const votes = await supabaseAdmin.from('canta_votes').select('talent_id').eq('voter_email', session.data.email).is('withdrawn_at', null);
  if (votes.error) throw new Error('Não foi possível consultar seus votos.');
  return { ...base, voter: { name: session.data.name }, votedIds: (votes.data ?? []).map(v => v.talent_id) };
});

export const castVote = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ talentId: z.number().int().refine(id => talents.some(t => t.id === id)) }).parse(input))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    if (!isVotingOpen(new Date())) throw new Error('A votação foi encerrada em 09/12/2026.');
    const token = getCookie(COOKIE);
    if (!token || token.length !== 72) throw new Error('Identifique-se antes de votar.');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: session, error: sessionError } = await supabaseAdmin.from('canta_voter_sessions').select('id,name,email,expires_at').eq('token_hash', hash).maybeSingle();
    if (sessionError || !session || new Date(session.expires_at) <= new Date()) throw new Error('Identifique-se novamente para votar.');
    const { error } = await supabaseAdmin.from('canta_votes').insert({ session_id: session.id, voter_name: session.name, voter_email: session.email, talent_id: data.talentId });
    if (error && error.code !== '23505') throw new Error('Não foi possível registrar o voto. Tente novamente.');
    let alreadyVoted = error?.code === '23505';
    if (alreadyVoted) {
      const restored = await supabaseAdmin.from('canta_votes')
        .update({ withdrawn_at: null, session_id: session.id, voter_name: session.name, created_at: new Date().toISOString() })
        .eq('voter_email', session.email).eq('talent_id', data.talentId).not('withdrawn_at', 'is', null).select('id');
      if (restored.error) throw new Error('Não foi possível registrar o voto. Tente novamente.');
      alreadyVoted = !restored.data?.length;
    }
    const { syncVoteSheet } = await import('./vote-export.server');
    const sheetPending = await syncVoteSheet(supabaseAdmin, process.env['LOVABLE_API_KEY'], process.env['GOOGLE_SHEETS_API_KEY']);
    const count = await supabaseAdmin.from('canta_votes').select('id', { count: 'exact', head: true }).eq('talent_id', data.talentId).is('withdrawn_at', null);
    return { alreadyVoted, sheetPending, total: count.count ?? 0 };
  });

export const withdrawVote = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ talentId: z.number().int().refine(id => talents.some(t => t.id === id)) }).parse(input))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    if (!isVotingOpen(new Date())) throw new Error('A votação foi encerrada em 09/12/2026.');
    const token = getCookie(COOKIE);
    if (!token || token.length !== 72) throw new Error('Identifique-se antes de retirar seu voto.');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const session = await supabaseAdmin.from('canta_voter_sessions').select('email,expires_at').eq('token_hash', hash).maybeSingle();
    if (session.error || !session.data || new Date(session.data.expires_at) <= new Date()) throw new Error('Identifique-se novamente para retirar seu voto.');
    const removed = await supabaseAdmin.from('canta_votes').update({ withdrawn_at: new Date().toISOString() })
      .eq('voter_email', session.data.email).eq('talent_id', data.talentId).is('withdrawn_at', null);
    if (removed.error) throw new Error('Não foi possível retirar seu voto. Tente novamente.');
    const { syncVoteSheet } = await import('./vote-export.server');
    const sheetPending = await syncVoteSheet(supabaseAdmin, process.env['LOVABLE_API_KEY'], process.env['GOOGLE_SHEETS_API_KEY']);
    const count = await supabaseAdmin.from('canta_votes').select('id', { count: 'exact', head: true }).eq('talent_id', data.talentId).is('withdrawn_at', null);
    return { sheetPending, total: count.count ?? 0 };
  });

export const leaveVoting = createServerFn({ method: 'POST' }).handler(async () => {
  setResponseHeader('Cache-Control', 'no-store');
  deleteCookie(COOKIE, voterCookieOptions(getRequestUrl({ xForwardedProto: true })));
  return { ok: true };
});
import { z } from 'zod';

export const VOTING_CLOSES_AT = '2026-12-10T03:00:00.000Z';
export const CORPORATE_DOMAINS = ['canta.ag', 'cantacom.com.br'];
export const voterSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(100, 'Use até 100 caracteres.'),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(254)
    .refine(email => CORPORATE_DOMAINS.includes(email.split('@')[1] ?? ''), 'Use seu e-mail @canta.ag ou @cantacom.com.br.'),
});
export function isVotingOpen(now: Date) { return now.getTime() < new Date(VOTING_CLOSES_AT).getTime(); }
export function toggleVoteSelection(previous: Record<number, boolean>, id: number) {
  return previous[id] ? previous : { ...previous, [id]: true };
}
export function removeVoteSelection(previous: Record<number, boolean>, id: number) {
  const next = { ...previous };
  delete next[id];
  return next;
}
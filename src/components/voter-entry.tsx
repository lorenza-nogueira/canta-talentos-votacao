import { useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { registerVoter } from '@/lib/voting.functions';
import { votingQueryOptions } from '@/lib/voting-query';
import { voterSchema } from '@/lib/voting-rules';

export function VoterEntry({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = useServerFn(registerVoter);
  const queryClient = useQueryClient();
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = voterSchema.safeParse({ name, email });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Confira os dados.'); return; }
    setBusy(true); setError('');
    try {
      await register({ data: parsed.data });
      const state = await queryClient.fetchQuery({ ...votingQueryOptions(), staleTime: 0 });
      if (!state.voter) {
        setError('Sua identificação não foi mantida. Confira se o navegador permite cookies para esta página e tente novamente.');
        return;
      }
      onSuccess();
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível continuar. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl block gap-0 overflow-y-auto overscroll-contain rounded-lg p-0" onOpenAutoFocus={() => { setError(''); }}>
      <div className="shrink-0 border-b-2 border-foreground px-5 py-4 pr-12">
        <p className="mb-1 text-xs font-bold text-accent">CANTA TALENTOS 2026</p>
        <DialogTitle className="text-2xl font-black leading-tight">Antes de votar</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-body-copy">Celebre os nossos talentos.</DialogDescription>
      </div>
      <form onSubmit={submit} className="block">
        <div className="px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0"><label htmlFor="voter-name" className="mb-2 block text-sm font-bold">Seu nome</label><Input id="voter-name" autoComplete="name" required minLength={2} maxLength={100} disabled={busy} value={name} onChange={e => setName(e.target.value)} className="h-12" /></div>
            <div className="min-w-0"><label htmlFor="voter-email" className="mb-2 block text-sm font-bold">E-mail da CANTA</label><Input id="voter-email" type="email" autoComplete="email" required maxLength={254} disabled={busy} value={email} onChange={e => setEmail(e.target.value)} className="h-12" /><p className="mt-2 text-xs text-body-copy">@canta.ag ou @cantacom.com.br</p></div>
          </div>
          <section className="mt-5 space-y-3 border-t border-border pt-5 text-sm leading-relaxed" aria-labelledby="voting-instructions">
        <h2 id="voting-instructions" className="text-lg font-black">🗳️ Como votar?</h2>
        <p className="font-bold">É simples e rápido!</p>
        <p><strong>Vote à vontade!</strong> Você pode escolher quantos talentos quiser. Não precisa escolher só um!</p>
        <p><strong>Fique de olho no prazo!</strong> A votação fica aberta até <strong>09/12</strong>. Não deixe para a última hora!</p>
        <h2 className="pt-2 text-lg font-black">🏆 E a premiação?</h2>
        <p>Seu voto ajuda a reconhecer e celebrar os talentos da CANTA! Os mais votados serão premiados.</p>
        <p>Explore, descubra e valorize os talentos da nossa gente. Afinal, todo talento merece ser celebrado! ✨</p>
          </section>
        </div>
        <div className="sticky bottom-0 space-y-3 border-t border-border bg-background px-5 py-4">
        {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="h-12 w-full whitespace-normal font-black">{busy ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{busy ? 'Continuando…' : 'Continuar para votar'}</Button>
        <p className="text-xs leading-relaxed text-body-copy">Seu nome e e-mail serão registrados com seus votos e acessíveis somente à organização. Um voto por talento e e-mail.</p>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
import { createFileRoute } from '@tanstack/react-router';
import { CantaFeed } from './index';
import { votingQueryOptions } from '@/lib/voting-query';
export const Route = createFileRoute('/votar')({
  loader: ({ context }) => context.queryClient.ensureQueryData(votingQueryOptions()),
  head: () => ({ meta: [
    { title: 'Votação CANTA. Talentos — Identificação' },
    { name: 'description', content: 'Identifique-se com seu nome e e-mail CANTA e participe da votação dos nossos talentos até 09/12/2026.' },
    { property: 'og:title', content: 'Votação CANTA. Talentos — Identificação' },
    { property: 'og:description', content: 'Conheça as regras e celebre os talentos da nossa gente.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  staticData: { importedDocument: { html: { lang: 'pt-BR' } } },
  component: CantaFeed,
});
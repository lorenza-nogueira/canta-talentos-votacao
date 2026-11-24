import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, LoaderCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UploadedPdfReader({ src, pages, title = 'Palco' }: {
  src: string;
  pages: { url: string; width: number; height: number }[];
  title?: string;
}) {
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const current = pages[page - 1];
  function goTo(next: number) {
    if (!Number.isInteger(next) || next < 1 || next > pages.length || next === page) return;
    setBusy(true); setError(false); setPage(next);
  }
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-b border-border bg-background px-3 py-2">
      <Button variant="outline" size="icon" aria-label="Página anterior" title="Página anterior" disabled={page <= 1} onClick={() => goTo(page - 1)}><ChevronLeft /></Button>
      <label className="flex items-center gap-2 text-sm text-foreground"><span className="sr-only">Página do PDF</span>
        <input aria-label="Página do PDF" type="number" min={1} max={pages.length} value={page} onChange={event => goTo(Number(event.target.value))} className="h-9 w-16 rounded border border-border bg-background px-2 text-center" />
        <span>/ {pages.length}</span>
      </label>
      <Button variant="outline" size="icon" aria-label="Próxima página" title="Próxima página" disabled={page >= pages.length} onClick={() => goTo(page + 1)}><ChevronRight /></Button>
      <Button asChild variant="outline" size="icon"><a href={src} download={`${title}.pdf`} aria-label="Baixar PDF" title="Baixar PDF"><Download /></a></Button>
    </div>
    <div key={page} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted p-3">
      {busy && !error && <div role="status" className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-background p-3 text-sm text-body-copy"><LoaderCircle className="h-4 w-4 animate-spin" />Carregando PDF…</div>}
      {error && <div role="alert" className="flex flex-col items-center gap-3 p-5 text-sm text-destructive"><p>Não foi possível carregar esta página.</p><Button variant="outline" onClick={() => { setBusy(true); setError(false); setRetry(value => value + 1); }}><RotateCw />Tentar novamente</Button></div>}
      {current && <img key={`${page}-${retry}`} src={current.url} width={current.width} height={current.height} alt={`Página ${page} do PDF ${title}`} onLoad={() => setBusy(false)} onError={() => { setBusy(false); setError(true); }} className={`mx-auto block h-auto max-w-full bg-background ${busy || error ? 'invisible' : ''}`} />}
    </div>
  </div>;
}
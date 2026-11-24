import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, LoaderCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PdfReader({ src }: { src: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    setBusy(true); setError(''); setDocument(null); setPage(1);
    async function load() {
      try {
        const [pdfjs, worker] = await Promise.all([
          import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        ]);
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const task = pdfjs.getDocument({ url: src });
        destroy = () => { void task.destroy(); };
        const result = await task.promise;
        if (!cancelled) setDocument(result);
      } catch {
        if (!cancelled) { setError('Não foi possível abrir o PDF. Tente novamente.'); setBusy(false); }
      }
    }
    void load();
    return () => { cancelled = true; destroy?.(); };
  }, [src, retry]);

  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    let render: RenderTask | undefined;
    setBusy(true); setError('');
    async function showPage() {
      try {
        const pdfPage = await document?.getPage(page);
        const target = canvas.current;
        const context = target?.getContext('2d');
        if (cancelled || !pdfPage || !target || !context) return;
        const viewport = pdfPage.getViewport({ scale: 1.5 });
        target.width = Math.ceil(viewport.width);
        target.height = Math.ceil(viewport.height);
        render = pdfPage.render({ canvas: target, canvasContext: context, viewport });
        await render.promise;
        if (!cancelled) setBusy(false);
      } catch {
        if (!cancelled) { setError('Não foi possível carregar esta página. Tente novamente.'); setBusy(false); }
      }
    }
    void showPage();
    return () => { cancelled = true; render?.cancel(); };
  }, [document, page]);

  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex shrink-0 items-center justify-center gap-3 border-b border-border bg-background px-3 py-2">
      <Button variant="outline" size="icon" aria-label="Página anterior" title="Página anterior" disabled={!document || page <= 1 || busy} onClick={() => setPage(value => value - 1)}><ChevronLeft /></Button>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <span className="sr-only">Página do PDF</span>
        <input aria-label="Página do PDF" type="number" min={1} max={document?.numPages ?? 1} value={page} disabled={!document || busy} onChange={event => {
          const next = Number(event.target.value);
          if (document && Number.isInteger(next) && next >= 1 && next <= document.numPages) setPage(next);
        }} className="h-9 w-16 rounded border border-border bg-background px-2 text-center" />
        <span>/ {document?.numPages ?? '…'}</span>
      </label>
      <Button variant="outline" size="icon" aria-label="Próxima página" title="Próxima página" disabled={!document || page >= document.numPages || busy} onClick={() => setPage(value => value + 1)}><ChevronRight /></Button>
    </div>
    <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted p-3">
      {busy && <div role="status" className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-background p-3 text-sm text-body-copy"><LoaderCircle className="h-4 w-4 animate-spin" />Carregando PDF…</div>}
      {error && <div role="alert" className="flex flex-col items-center gap-3 p-5 text-sm text-destructive"><p>{error}</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}><RotateCw />Tentar novamente</Button></div>}
      <canvas ref={canvas} aria-label={`Página ${page} do PDF`} className={`mx-auto block h-auto max-w-full bg-background ${busy || error ? 'invisible' : ''}`} />
    </div>
  </div>;
}
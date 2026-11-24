import { useState, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PdfReader } from '@/components/pdf-reader';
import { UploadedPdfReader } from '@/components/uploaded-pdf-reader';
import { instagramEmbedUrl, spotifyEmbedUrl, youtubeEmbedUrl } from '@/lib/media-links';
import palcoAsset from '@/assets/canta/palco-diagramado-v5.pdf.asset.json';
import palcoPages from '@/assets/canta/palco-pages.json';
import nayaneAsset from '@/assets/canta/nayane-croche.pdf.asset.json';
import nayanePages from '@/assets/canta/nayane-croche-pages.json';
import registrationDocuments from '@/assets/canta/registrations/documents.json';

const uploadedDocuments = [
  { src: palcoAsset.url, pages: palcoPages, title: 'Palco' },
  { src: nayaneAsset.url, pages: nayanePages, title: 'Crochê — Nayane' },
  ...registrationDocuments,
];

export function MaterialAccess({ href, pdf = false, label, children, className, variant = 'default' }: {
  href: string;
  pdf?: boolean;
  label: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonProps['variant'];
}) {
  const [open, setOpen] = useState(false);
  const embed = youtubeEmbedUrl(href);
  const instagram = instagramEmbedUrl(href);
  const spotify = spotifyEmbedUrl(href);
  const inPage = pdf || Boolean(embed) || Boolean(instagram) || Boolean(spotify);
  const uploadedDocument = uploadedDocuments.find(document => document.src === href);
  return <>
    <Button asChild variant={variant} className={className}>
      <a href={href} aria-label={label} title={label} target={inPage ? undefined : '_blank'} rel="noopener noreferrer" onClick={event => {
        if (inPage && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); setOpen(true); }
      }}>{children}</a>
    </Button>
    {inPage && <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby={undefined} className={`flex w-[calc(100%-2rem)] ${instagram ? 'max-w-lg' : 'max-w-3xl'} flex-col gap-0 overflow-hidden rounded-lg p-0 ${pdf || instagram ? 'h-[calc(100dvh-2rem)]' : 'max-h-[calc(100dvh-2rem)]'}`}>
        <div className="shrink-0 border-b border-border px-4 py-4 pr-12"><DialogTitle className="break-words text-base font-black">{label}</DialogTitle></div>
        {pdf ? uploadedDocument ? <UploadedPdfReader src={href} pages={uploadedDocument.pages} title={uploadedDocument.title} /> : <PdfReader src={href} /> : <iframe src={instagram ?? spotify ?? embed ?? undefined} title={label} className={instagram ? 'min-h-0 w-full flex-1 border-0 bg-background' : spotify ? 'h-[352px] w-full shrink-0 border-0 bg-muted' : 'aspect-video w-full shrink-0 border-0 bg-muted'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
      </DialogContent>
    </Dialog>}
  </>;
}
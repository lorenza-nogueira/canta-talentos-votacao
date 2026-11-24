import { useState, useMemo, useEffect, useRef, type JSX } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from '@tanstack/react-start';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, Heart, HeartOff, LoaderCircle, ExternalLink, ArrowRight, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryScroller } from '@/components/category-scroller';
import { VoterEntry } from '@/components/voter-entry';
import { AdaptiveMedia } from '@/components/adaptive-media';
import { MaterialAccess } from '@/components/material-access';
import { castVote, withdrawVote, leaveVoting } from '@/lib/voting.functions';
import { votingQueryOptions } from '@/lib/voting-query';
import { materialDestination } from '@/lib/media-links';
import sheetTalents from "@/data/talents.json";
import cantaImage21 from "@/assets/canta/canta-talentos-logo.jpg.asset.json";
const logoImg = cantaImage21.url

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const INK   = 'var(--foreground)'
const PINK  = 'var(--primary)'
const BLUE  = 'var(--accent)'
const WHITE = 'var(--background)'
const GRAY  = 'var(--muted)'
const MID   = 'var(--muted-foreground)'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'feed' | 'explore' | 'ranking' | 'myvotes' | 'profile'
type RankingTab = 'top' | 'week' | 'new'

interface TalentLink { type: string; url: string; label?: string }
interface Social { type: string; url: string }
interface Talent {
  previewUrl?: string | undefined;
  mediaWidth: number; mediaHeight: number;
  id: number; name: string; role: string; area: string; company: string
  date: string; isNew: boolean; weeklyHighlight: boolean
  avatar: string; cover: string; gallery: string[]; videoUrl?: string | undefined
  projectName: string; description: string; goals: string[]; materials: string[]
  tags: string[]; links: TalentLink[]; socials: Social[]; votes: number
}

// ─── Area chip config ─────────────────────────────────────────────────────────
// Alternates pink / blue for the brand duality
const areaAccent = (tag: string) => { const i = ALL_TAGS.indexOf(tag); return i % 2 === 1 ? PINK : BLUE }
const DEFAULT_AREA = { bg: GRAY, text: INK, border: 'var(--border-strong)' }
const AREA_CFG: Record<string, { bg: string; text: string; border: string }> = {
  Design:      { bg: 'var(--primary-soft)', text: PINK,  border: PINK  },
  Fotografia:  { bg: 'var(--accent-soft)', text: BLUE,  border: BLUE  },
  Música:      { bg: 'var(--primary-soft)', text: PINK,  border: PINK  },
  Esportes:    { bg: 'var(--accent-soft)', text: BLUE,  border: BLUE  },
  Tecnologia:  { bg: 'var(--primary-soft)', text: PINK,  border: PINK  },
  Artesanato:  { bg: 'var(--accent-soft)', text: BLUE,  border: BLUE  },
  Idiomas:     { bg: 'var(--primary-soft)', text: PINK,  border: PINK  },
  'Bem-estar': { bg: 'var(--accent-soft)', text: BLUE,  border: BLUE  },
  Comunicação: { bg: 'var(--primary-soft)', text: PINK,  border: PINK  },
  Branding:    { bg: 'var(--accent-soft)', text: BLUE,  border: BLUE  },
  Outros:      { bg: 'var(--muted)', text: INK,   border: 'var(--border-strong)' },
}

const ALL_TAGS = ['Todos', ...Array.from(new Set(sheetTalents.map(t => t.category)))]

const LINK_META: Record<string, { icon: JSX.Element; label: string }> = {
  behance:   { icon: <BehanceIcon />,   label: 'Behance'   },
  youtube:   { icon: <YoutubeIcon />,   label: 'YouTube'   },
  linkedin:  { icon: <LinkedinIcon />,  label: 'LinkedIn'  },
  portfolio: { icon: <PortfolioIcon />, label: 'Portfólio' },
  site:      { icon: <GlobeIcon />,     label: 'Site'      },
  artigo:    { icon: <ArticleIcon />,   label: 'Artigo'    },
  projeto:   { icon: <FolderIcon />,    label: 'Projeto'   },
  video:     { icon: <PlayCircleIcon/>, label: 'Vídeo'     },
  foto:      { icon: <PortfolioIcon />, label: 'Foto'      },
  audio:     { icon: <PlayCircleIcon/>, label: 'Áudio'     },
  pdf:       { icon: <ArticleIcon />,   label: 'PDF'       },
  spotify:   { icon: <PlayCircleIcon/>, label: 'Spotify'   },
  instagram: { icon: <InstagramIcon />, label: 'Instagram' },
}

const SOCIAL_META: Record<string, { label: string; icon: JSX.Element }> = {
  instagram: { label: 'Instagram', icon: <InstagramIcon /> },
  tiktok:    { label: 'TikTok',    icon: <TiktokIcon />    },
  youtube:   { label: 'YouTube',   icon: <YoutubeIcon />   },
  behance:   { label: 'Behance',   icon: <BehanceIcon />   },
  linkedin:  { label: 'LinkedIn',  icon: <LinkedinIcon />  },
}

const MAX_VOTES = sheetTalents.length // legacy unmounted views only

// ─── Data (snapshot of the "CANTA Talentos - Inscrições" sheet; e-mails omitted) ─
const TALENTS: Talent[] = sheetTalents.map((r) => ({
  previewUrl: 'previewUrl' in r ? r.previewUrl : undefined,
  mediaWidth: r.mediaWidth, mediaHeight: r.mediaHeight,
  id: r.id, name: r.name, role: r.participation, area: r.category, company: r.team,
  date: '', isNew: false, weeklyHighlight: false, avatar: '', cover: r.cover, gallery: [], videoUrl: 'videoUrl' in r ? (r as { videoUrl?: string }).videoUrl : undefined,
  projectName: r.projectName, description: r.description, goals: [], materials: [],
  tags: [r.category], links: r.links, socials: [], votes: 0,
}))

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BehanceIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.726zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/></svg> }
function YoutubeIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> }
function LinkedinIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> }
function InstagramIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> }
function TiktokIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.67a8.18 8.18 0 004.78 1.53V6.71a4.85 4.85 0 01-1.01-.02z"/></svg> }
function GlobeIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> }
function PortfolioIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> }
function ArticleIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function FolderIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> }
function PlayCircleIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg> }
function HeartIcon({ filled }: { filled?: boolean }) { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> }
function SearchIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> }
function StarDecor({ size = 16, color = PINK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" />
    </svg>
  )
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────
function TagChip({ tag }: { tag: string }) {
  const c = AREA_CFG[tag] || DEFAULT_AREA
  return (
    <span className="px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wide" style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}` }}>
      {tag}
    </span>
  )
}

// ─── Expandable text ──────────────────────────────────────────────────────────
function ExpandableText({ text, limit = 28, preserveLines = false }: { text: string; limit?: number; preserveLines?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const words = text.split(' ')
  const long = !preserveLines && words.length > limit
  return (
    <p className={`text-sm leading-relaxed ${preserveLines ? 'whitespace-pre-line [overflow-wrap:anywhere]' : ''}`} style={{ color: 'var(--body-copy)' }}>
      {long && !expanded
        ? <>{words.slice(0, limit).join(' ')}… <Button variant="link" onClick={() => setExpanded(true)} className="h-auto p-0 font-bold text-accent">Ver mais</Button></>
        : <>{text} {long && <Button variant="link" onClick={() => setExpanded(false)} className="h-auto p-0 font-bold text-accent">Ver menos</Button>}</>
      }
    </p>
  )
}

// ─── Vote Button ──────────────────────────────────────────────────────────────
function VoteButton({ votes, voted, onVote, size = 'md', canVote, busy = false }: {
  votes: number; voted: boolean; onVote: () => void; size?: 'sm'|'md'|'lg'; canVote: boolean; busy?: boolean
}) {
  return <Button onClick={onVote} disabled={!canVote || busy}
    className={`vote-button font-black ${size === 'lg' ? 'h-12 w-full' : 'h-11 px-5'} ${voted ? 'bg-accent text-accent-foreground disabled:opacity-100' : 'bg-primary text-primary-foreground'}`}>
    {busy ? <LoaderCircle className="animate-spin" /> : voted ? <HeartOff /> : <Heart />}
    {busy ? voted ? 'Retirando…' : 'Registrando…' : !canVote ? 'Encerrada' : voted ? 'Retirar voto' : 'Votar'}
    <span className="ml-1 text-xs">{votes}</span>
  </Button>
}

function MediaLinks({ talent }: { talent: Talent }) {
  return talent.links.length ? <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3">
    <span className="mr-1 text-xs font-black text-foreground">Acesse aqui</span>
    {talent.links.map((link, index) => <MaterialAccess key={index} href={materialDestination(link, talent.previewUrl)} pdf={link.type === 'pdf'}
      label={link.label || LINK_META[link.type]?.label || link.type}
      className="h-10 max-w-full whitespace-normal bg-accent text-xs font-bold text-accent-foreground hover:bg-accent/90">
      {LINK_META[link.type]?.icon ?? <ExternalLink />}{link.label || LINK_META[link.type]?.label || link.type}<ExternalLink />
    </MaterialAccess>)}
  </div> : null;
}

function TalentMedia({ talent }: { talent: Talent }) {
  return <AdaptiveMedia src={talent.cover} alt={talent.projectName} width={talent.mediaWidth} height={talent.mediaHeight} />;
}

function TalentPreview({ talent, onDetail }: { talent: Talent; onDetail?: () => void }) {
  if (talent.videoUrl) {
    return <AdaptiveMedia src={talent.videoUrl} poster={talent.cover} alt={`Vídeo de ${talent.projectName}`} width={talent.mediaWidth} height={talent.mediaHeight} video />;
  }
  const file = talent.links.find(link => ['pdf', 'video', 'youtube'].includes(link.type));
  if (file) {
    const isPdf = file.type === 'pdf';
    const label = `Abrir ${isPdf ? 'PDF' : 'vídeo'} de ${talent.projectName}`;
    return <MaterialAccess href={materialDestination(file, talent.previewUrl)} pdf={isPdf} label={label} variant="ghost" className="relative block h-auto w-full rounded-none p-0 hover:bg-muted">
        <TalentMedia talent={talent} />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {isPdf ? <FileText /> : <Play />}
        </span>
    </MaterialAccess>;
  }
  return onDetail ? <Button variant="ghost" onClick={onDetail} aria-label={`Ver ${talent.projectName}`} className="block h-auto w-full rounded-none p-0 hover:bg-muted">
    <TalentMedia talent={talent} />
  </Button> : <TalentMedia talent={talent} />;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ talent, voted, onVote, onClose, canVote, busy = false }: {
  talent: Talent; voted: boolean; onVote: () => void; onClose: () => void; canVote: boolean; busy?: boolean
}) {
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    panel?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panel) return
      const controls = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],iframe,[tabindex="0"]'))
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); previousFocus?.focus() }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'var(--overlay)' }} onClick={onClose} />
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={talent.projectName} className="relative w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col" style={{ background: WHITE, animation: 'slideUp .28s cubic-bezier(.16,1,.3,1)' }}>

        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-black text-sm">{talent.projectName}</p>
          <Button aria-label="Fechar detalhes" variant="ghost" size="icon" onClick={onClose}>✕</Button>
        </div>
        <div className="overflow-y-auto">
          <TalentPreview talent={talent} />
          <MediaLinks talent={talent} />

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-black text-xl leading-tight" style={{ color: INK }}>{talent.name}</p>
              <p className="text-xs" style={{ color: MID }}>{talent.role} · {talent.company}</p>
            </div>
            <div className="flex gap-1">
              {talent.socials.map((s, i) => {
                const m = SOCIAL_META[s.type]; if (!m) return null
                return <a key={i} href={s.url} title={m.label} className="w-8 h-8 rounded flex items-center justify-center transition-colors" style={{ background: GRAY, color: MID }}>{m.icon}</a>
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="font-black text-xl leading-tight mb-2" style={{ color: INK }}>{talent.projectName}</h2>
            <div className="flex flex-wrap gap-1.5">{talent.tags.map(t => <TagChip key={t} tag={t} />)}</div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: MID }}>Sobre o projeto</p>
            <p className={`text-sm leading-relaxed ${talent.id === 6 ? 'whitespace-pre-line [overflow-wrap:anywhere]' : ''}`} style={{ color: 'var(--body-copy)' }}>{talent.description}</p>
          </div>

          {/* Goals */}
          {talent.goals.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: MID }}>Objetivos</p>
              <ul className="space-y-2">
                {talent.goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--body-strong)' }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-primary-foreground flex-shrink-0 mt-0.5" style={{ background: i % 2 === 0 ? PINK : BLUE }}>{i+1}</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Materials */}
          {talent.materials.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: MID }}>Materiais complementares</p>
              <ul className="space-y-1.5">
                {talent.materials.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm px-3 py-2 rounded" style={{ background: GRAY, color: 'var(--body-strong)' }}>
                    <span style={{ color: i % 2 === 0 ? PINK : BLUE, fontWeight: 900 }}>★</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
                  </div>
        </div>
        <div className="border-t border-border bg-background p-4">
          <VoteButton votes={talent.votes} voted={voted} onVote={onVote} size="lg" canVote={canVote} busy={busy} />
        </div>
      </div>
    </div>
  )
}

// ─── Talent Card ──────────────────────────────────────────────────────────────
function TalentCard({ talent, voted, onVote, onDetail, canVote, busy = false }: {
  talent: Talent; voted: boolean; onVote: () => void; onDetail: () => void; canVote: boolean; busy?: boolean
}) {
  return <article className="talent-card overflow-hidden bg-background transition-transform motion-safe:hover:-translate-y-0.5">
    <div className="px-4 py-3">
      <p className="font-black text-xl leading-tight tracking-tight">{talent.name}</p>
      <p className="mt-1 break-words text-xs text-body-copy">{talent.company} · {talent.role}</p>
    </div>
    <TalentPreview talent={talent} onDetail={onDetail} />
    <MediaLinks talent={talent} />
    <div className="space-y-3 px-4 py-4">
      <p className="text-xs font-bold text-accent">{talent.area}</p>
      <h2 className="break-words text-2xl font-black leading-tight">{talent.projectName}</h2>
      <ExpandableText text={talent.description} preserveLines={talent.id === 6} />
    </div>
    <div className="talent-actions flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
      <VoteButton votes={talent.votes} voted={voted} onVote={onVote} canVote={canVote} busy={busy} />
      <Button variant="link" onClick={onDetail} className="px-1 text-xs font-black text-accent">Ver detalhes <ArrowRight /></Button>
    </div>
  </article>
}

// ─── Ranking View ─────────────────────────────────────────────────────────────
function RankingView({ talents, onDetail }: { talents: Talent[]; onDetail: (t: Talent) => void }) {
  const [rankTab, setRankTab] = useState<RankingTab>('top')

  const sorted = useMemo(() => {
    if (rankTab === 'top')  return [...talents].sort((a, b) => b.votes - a.votes)
    if (rankTab === 'week') return talents.filter(t => t.weeklyHighlight)
    return talents.filter(t => t.isNew)
  }, [rankTab, talents])

  const tabs = [
    { key: 'top'  as RankingTab, label: 'Mais votados'       },
    { key: 'week' as RankingTab, label: 'Destaque da semana' },
    { key: 'new'  as RankingTab, label: 'Novos talentos'     },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setRankTab(t.key)}
            className="flex-shrink-0 px-4 py-2 text-sm font-black uppercase rounded transition-all"
            style={rankTab === t.key ? { background: INK, color: WHITE } : { background: GRAY, color: INK, border: `2px solid transparent` }}
          >{t.label}</button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎵</div>
          <p className="text-sm" style={{ color: MID }}>Nenhum talento nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((talent, idx) => {
            const medalColors = ['var(--medal-gold)','var(--medal-silver)','var(--medal-bronze)']
            const medal = idx < 3 ? ['🥇','🥈','🥉'][idx] : null
            return (
              <div key={talent.id} className="flex gap-3 items-center p-3 rounded transition-shadow hover:shadow-md" style={{ background: WHITE, border: `2px solid ${INK}`, boxShadow: '2px 2px 0 var(--foreground)' }}>
                <div className="w-8 h-8 rounded flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: idx < 3 ? medalColors[idx] : GRAY, color: idx < 3 ? WHITE : MID }}>
                  {medal || idx + 1}
                </div>
                <img src={talent.cover} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" style={{ border: `2px solid var(--separator)` }} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate" style={{ color: INK }}>{talent.projectName}</p>
                  <p className="text-xs" style={{ color: MID }}>{talent.name}</p>
                  <div className="flex gap-1 mt-1">{talent.tags.slice(0, 2).map(t => <TagChip key={t} tag={t} />)}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1 font-black" style={{ color: PINK }}>
                    <HeartIcon filled /> {talent.votes}
                  </div>
                  <button onClick={() => onDetail(talent)} className="text-xs font-black uppercase" style={{ color: BLUE }}>Ver →</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Explore View ─────────────────────────────────────────────────────────────
function ExploreView({ talents, onDetail }: { talents: Talent[]; onDetail: (t: Talent) => void }) {
  const knownAreas = ['Design','Fotografia','Música','Esportes','Tecnologia','Artesanato','Idiomas','Bem-estar']
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: MID }}>Explore por área</p>
      <div className="grid grid-cols-2 gap-3 mb-7">
        {knownAreas.map((area, i) => {
          const count = talents.filter(t => t.tags.includes(area) || t.area === area).length
          if (count === 0) return null
          const accent = i % 2 === 0 ? PINK : BLUE
          return (
            <div key={area} className="p-4 rounded cursor-pointer transition-transform hover:-translate-y-0.5" style={{ background: WHITE, border: `2px solid ${accent}`, boxShadow: `2px 2px 0 ${accent}` }}>
              <p className="font-black text-base" style={{ color: accent }}>{area}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: MID }}>{count} talento{count !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>

      <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: MID }}>Todos os talentos</p>
      <div className="grid grid-cols-2 gap-3">
        {talents.map((talent, i) => (
          <button key={talent.id} onClick={() => onDetail(talent)} className="text-left overflow-hidden rounded transition-all hover:-translate-y-0.5" style={{ background: WHITE, border: `2px solid ${INK}`, boxShadow: '2px 2px 0 var(--foreground)' }}>
            <div className="relative bg-muted" style={{ aspectRatio: '1' }}>
              <img src={talent.cover} alt={talent.projectName} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--media-shade-strong) 0%, transparent 55%)' }} />
              <p className="absolute bottom-2 left-2 right-2 font-black text-xs text-primary-foreground leading-tight">{talent.projectName}</p>
            </div>
            <div className="px-2.5 py-2">
              <p className="text-sm font-black truncate" style={{ color: INK }}>{talent.name}</p>
              <div className="flex items-center gap-1 mt-0.5" style={{ color: PINK }}>
                <HeartIcon filled /><span className="text-xs font-black">{talent.votes}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── My Votes View ────────────────────────────────────────────────────────────
function MyVotesView({ talents, votes, voteCount, onDetail }: {
  talents: Talent[]; votes: Record<number, boolean>; voteCount: number; onDetail: (t: Talent) => void
}) {
  const voted = talents.filter(t => votes[t.id])
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="font-black text-lg" style={{ color: INK }}>Meus Votos</p>
        <span className="text-sm font-black px-3 py-1 rounded-sm" style={{ background: GRAY, color: INK }}>{voteCount}/{MAX_VOTES}</span>
      </div>

      {/* Progress */}
      <div className="p-4 rounded mb-5" style={{ background: WHITE, border: `2px solid ${INK}`, boxShadow: '2px 2px 0 var(--foreground)' }}>
        <div className="flex justify-between text-xs font-bold mb-2" style={{ color: MID }}>
          <span>Votos utilizados</span>
          <span style={{ color: PINK }}>{voteCount} de {MAX_VOTES}</span>
        </div>
        <div className="h-2 rounded-sm overflow-hidden" style={{ background: GRAY }}>
          <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${(voteCount / MAX_VOTES) * 100}%`, background: PINK }} />
        </div>
        <div className="flex justify-between mt-4">
          {Array.from({ length: MAX_VOTES }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: i < voteCount ? PINK : GRAY, color: i < voteCount ? WHITE : MID }}>
                <HeartIcon filled={i < voteCount} />
              </div>
              <span className="text-xs font-bold" style={{ color: MID }}>{i+1}º</span>
            </div>
          ))}
        </div>
      </div>

      {voted.length === 0 ? (
        <div className="text-center py-14">
          <div className="text-5xl mb-4">⭐</div>
          <p className="font-black text-lg" style={{ color: INK }}>Você ainda não votou</p>
          <p className="text-sm mt-1" style={{ color: MID }}>Explore e vote nos seus favoritos!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {voted.map(talent => (
            <div key={talent.id} className="flex gap-3 items-center p-3 rounded" style={{ background: WHITE, border: `2px solid ${INK}`, boxShadow: '2px 2px 0 var(--foreground)' }}>
              <img src={talent.cover} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate" style={{ color: INK }}>{talent.projectName}</p>
                <p className="text-xs" style={{ color: MID }}>{talent.name}</p>
                <div className="flex gap-1 mt-1">{talent.tags.slice(0, 1).map(t => <TagChip key={t} tag={t} />)}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-xs font-black px-2 py-0.5 rounded-sm text-primary-foreground" style={{ background: PINK }}>✓ Votado</span>
                <button onClick={() => onDetail(talent)} className="text-xs font-black" style={{ color: BLUE }}>Ver →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange, voteCount }: { active: Tab; onChange: (t: Tab) => void; voteCount: number }) {
  const items: { key: Tab; label: string; icon: string }[] = [
    { key: 'feed',    label: 'Feed',    icon: '⊞' },
    { key: 'explore', label: 'Explorar',icon: '◎' },
    { key: 'ranking', label: 'Ranking', icon: '↑' },
    { key: 'myvotes', label: 'Meu voto',icon: '♥' },
    { key: 'profile', label: 'Perfil',  icon: '◉' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ background: WHITE, borderTop: `2px solid ${INK}` }}>
      <div className="flex max-w-2xl mx-auto">
        {items.map(item => {
          const isActive = active === item.key
          return (
            <button key={item.key} onClick={() => onChange(item.key)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 relative transition-colors"
              style={{ color: isActive ? PINK : MID }}
            >
              {item.key === 'myvotes' && voteCount > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-3 w-4 h-4 rounded-full text-primary-foreground flex items-center justify-center font-black" style={{ background: BLUE, fontSize: 10 }}>{voteCount}</span>
              )}
              <span className="text-lg leading-none font-black">{item.icon}</span>
              <span className="text-xs font-black leading-none">{item.label}</span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5" style={{ background: PINK }} />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
function FeedSkeleton() {
  return <div className="mx-auto max-w-2xl space-y-5 px-4 py-8" aria-label="Carregando talentos">{[1, 2].map(id => <div key={id} className="space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="aspect-[4/3] w-full" /><Skeleton className="h-12 w-full" /></div>)}</div>
}

export function CantaFeed() {
  const { data: state } = useSuspenseQuery(votingQueryOptions());
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('Todos');
  const [detail, setDetail] = useState<Talent | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [onlyVoted, setOnlyVoted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [showEntry, setShowEntry] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const vote = useServerFn(castVote);
  const withdraw = useServerFn(withdrawVote);
  const leave = useServerFn(leaveVoting);
  const closeDetail = useMemo(() => () => setDetail(null), []);
  useEffect(() => {
    if (!state.voter && state.open) setShowEntry(true);
  }, [state.voter, state.open]);
  function openIdentification() { setDetail(null); setShowEntry(true); }
  const voteCount = state.votedIds.length;
  const talents = TALENTS.map(t => ({ ...t, votes: state.counts[t.id] ?? 0 }));
  const filtered = talents.filter(t => {
    const q = search.toLocaleLowerCase('pt-BR');
    return (!q || `${t.name} ${t.projectName} ${t.area}`.toLocaleLowerCase('pt-BR').includes(q)) &&
      (activeTag === 'Todos' || t.tags.includes(activeTag)) && (!onlyVoted || state.votedIds.includes(t.id));
  });
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || visibleCount >= filtered.length) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setVisibleCount(count => count + 3);
    }, { rootMargin: '300px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);
  async function handleVote(id: number) {
    if (!state.voter) { openIdentification(); return; }
    if (busyId !== null) return;
    const removing = state.votedIds.includes(id);
    setBusyId(id); setNotice(''); setNoticeError(false);
    try {
      if (removing) {
        const result = await withdraw({ data: { talentId: id } });
        queryClient.setQueryData(votingQueryOptions().queryKey, { ...state, votedIds: state.votedIds.filter(votedId => votedId !== id), counts: { ...state.counts, [id]: result.total } });
        setNotice(result.sheetPending ? 'Voto retirado! A atualização da planilha está pendente.' : 'Voto retirado. Você pode votar novamente se quiser.');
      } else {
        const result = await vote({ data: { talentId: id } });
        queryClient.setQueryData(votingQueryOptions().queryKey, { ...state, votedIds: Array.from(new Set([...state.votedIds, id])), counts: { ...state.counts, [id]: result.total } });
        setNotice(result.sheetPending ? 'Voto registrado! A atualização da planilha está pendente.' : result.alreadyVoted ? 'Você já votou neste talento com esse e-mail.' : 'Voto registrado! Obrigado por celebrar esse talento.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível votar. Tente novamente.';
      if (message.startsWith('Identifique-se')) openIdentification();
      setNoticeError(true); setNotice(message);
    }
    finally { setBusyId(null); }
  }
  async function changeVoter() {
    try {
      await leave();
      await queryClient.fetchQuery({ ...votingQueryOptions(), staleTime: 0 });
      setOnlyVoted(false);
      openIdentification();
    } catch { setNoticeError(true); setNotice('Não foi possível trocar a identificação. Tente novamente.'); }
  }
  return <div className="canta-app min-h-screen bg-background text-foreground">
    <header className="bg-foreground"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
      <Link to="/" aria-label="CANTA Talentos — início"><img src={logoImg} alt="CANTA Talentos" className="canta-logo" /></Link>
      {!state.voter ? <Button onClick={openIdentification} className="h-11 font-black"><Heart /> Participar</Button> : <div className="max-w-[45%] text-right text-primary-foreground"><p className="break-words text-sm font-bold">{state.voter.name}</p><Button variant="link" onClick={changeVoter} className="h-8 px-0 text-xs text-primary-foreground">Trocar identificação</Button></div>}
    </div></header>
    <div className="sticky top-0 z-30 border-b-2 border-foreground bg-background">
      <div className="mx-auto max-w-2xl px-4 pt-3">
        <div className="relative"><span className="pointer-events-none absolute left-3 top-3 text-body-copy"><SearchIcon /></span><input aria-label="Buscar talentos" placeholder="Buscar por nome, projeto ou área…" maxLength={150} value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(3); }} className="h-11 w-full rounded border border-border bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent" /></div>
        <CategoryScroller>
          {ALL_TAGS.map(tag => <Button key={tag} variant={activeTag === tag ? 'default' : 'outline'} aria-pressed={activeTag === tag} onClick={() => { setActiveTag(tag); setVisibleCount(3); }} className="h-8 shrink-0 px-3 text-xs font-bold">{tag}</Button>)}
        </CategoryScroller>
      </div>
    </div>
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold">{state.open ? 'Votação aberta até 09/12' : 'Votação encerrada'}</p>
        {state.voter && <p className="text-xs text-body-copy">{voteCount} talento{voteCount !== 1 ? 's' : ''} apoiado{voteCount !== 1 ? 's' : ''}</p>}
      </div>
      {notice && <div role={noticeError ? 'alert' : 'status'} className={`sticky top-32 z-20 mb-5 rounded border p-3 text-sm font-bold ${noticeError ? 'border-destructive bg-background text-destructive' : 'border-accent bg-accent-soft text-foreground'}`}>{notice}</div>}
      {onlyVoted && <div className="mb-4 flex items-center justify-between"><p className="font-black">Meus votos</p><Button variant="link" onClick={() => setOnlyVoted(false)} className="text-accent">Ver todos</Button></div>}
      {filtered.length === 0 ? <div className="py-16 text-center"><p className="text-lg font-black">{onlyVoted ? 'Você ainda não votou' : 'Nenhum talento encontrado'}</p><Button variant="link" onClick={() => { setSearch(''); setActiveTag('Todos'); setOnlyVoted(false); }} className="mt-2 text-accent">Ver todos os talentos</Button></div> : <div className="flex flex-col gap-7">
        {filtered.slice(0, visibleCount).map(talent => <TalentCard key={talent.id} talent={talent} voted={state.votedIds.includes(talent.id)} onVote={() => handleVote(talent.id)} onDetail={() => setDetail(talent)} canVote={state.open && busyId === null} busy={busyId === talent.id} />)}
      </div>}
      <div ref={sentinel}>{visibleCount < filtered.length && <div className="mt-6"><Skeleton className="aspect-[4/3] w-full" /><Button variant="link" className="mt-3 text-accent" onClick={() => setVisibleCount(count => count + 3)}>Mais talentos</Button></div>}</div>
      <p className="mt-10 text-center text-xs text-body-copy">CANTA Talentos 2026 · Todo talento merece ser celebrado.</p>
    </main>
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      {showTop && <Button size="icon" variant="outline" className="canta-fab h-12 w-12 rounded-full" aria-label="Voltar ao topo" title="Voltar ao topo" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp /></Button>}
      <Button size="icon" className="canta-fab h-12 w-12 rounded-full bg-accent text-accent-foreground" aria-label={state.voter ? 'Meus votos' : 'Participar da votação'} title={state.voter ? 'Meus votos' : 'Participar da votação'} onClick={() => { if (!state.voter) openIdentification(); else { setOnlyVoted(value => !value); setVisibleCount(3); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}><Heart /></Button>
    </div>
    {detail && <DetailModal talent={{ ...detail, votes: state.counts[detail.id] ?? 0 }} voted={state.votedIds.includes(detail.id)} onVote={() => handleVote(detail.id)} onClose={closeDetail} canVote={state.open && busyId === null} busy={busyId === detail.id} />}
    <VoterEntry open={showEntry} onOpenChange={setShowEntry} onSuccess={() => { setShowEntry(false); setNotice(''); }} />
  </div>
}

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(votingQueryOptions()),
  pendingComponent: FeedSkeleton,
  head: () => ({ meta: [
    { title: "Votação CANTA. Talentos" },
    { name: "description", content: "Conheça os projetos e talentos dos colaboradores no CANTA Talentos 2026." },
    { property: "og:title", content: "Votação CANTA. Talentos" },
    { property: "og:description", content: "Explore projetos, descubra talentos e apoie seus favoritos no CANTA Talentos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  staticData: { importedDocument: { html: { lang: "pt-BR" } } },
  component: CantaFeed,
});

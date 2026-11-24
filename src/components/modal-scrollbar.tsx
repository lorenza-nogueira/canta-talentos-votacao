import * as React from "react"

/**
 * A vertical scrollbar that lives inside the project details panel.
 *
 * Native scrollbars are not reliable here: operating systems can hide their
 * indicators, and the browser only paints them while the pointer is near. The
 * panel therefore draws its own track on the right edge and keeps the thumb in
 * sync with the scroll container, so the scrollable area is always visible.
 */
export function ModalScrollbar({ target }: { target: HTMLElement | null }) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [geom, setGeom] = React.useState({ visible: false, top: 0, height: 0, pct: 0 })
  const dragRef = React.useRef<{ pointerId: number; y: number; top: number } | null>(null)

  const measure = React.useCallback(() => {
    const el = target
    const track = trackRef.current
    if (!el || !track) return
    const trackH = track.clientHeight
    const overflow = el.scrollHeight - el.clientHeight
    if (overflow <= 1 || trackH <= 0) {
      setGeom((g) => (g.visible ? { ...g, visible: false, pct: 0 } : g))
      return
    }
    const height = Math.max(28, Math.round((el.clientHeight / el.scrollHeight) * trackH))
    const top = Math.round((el.scrollTop / overflow) * (trackH - height))
    const pct = Math.round((el.scrollTop / overflow) * 100)
    setGeom((g) => (g.visible && g.top === top && g.height === height && g.pct === pct ? g : { visible: true, top, height, pct }))
  }, [target])

  React.useEffect(() => {
    const el = target
    if (!el) return
    measure()
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    Array.from(el.children).forEach((node) => observer.observe(node))
    const media = Array.from(el.querySelectorAll("img,video"))
    media.forEach((node) => {
      node.addEventListener("load", measure)
      node.addEventListener("loadedmetadata", measure)
    })
    return () => {
      el.removeEventListener("scroll", onScroll)
      observer.disconnect()
      media.forEach((node) => {
        node.removeEventListener("load", measure)
        node.removeEventListener("loadedmetadata", measure)
      })
      if (frame) cancelAnimationFrame(frame)
    }
  }, [target, measure])

  const scrollTo = (value: number) => {
    const el = target
    if (!el) return
    const overflow = el.scrollHeight - el.clientHeight
    el.scrollTop = Math.min(overflow, Math.max(0, value))
  }

  const onThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = target
    if (!el) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, y: event.clientY, top: geom.top }
  }

  const onThumbPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = target
    const drag = dragRef.current
    const track = trackRef.current
    if (!el || !drag || !track || drag.pointerId !== event.pointerId) return
    const overflow = el.scrollHeight - el.clientHeight
    const max = Math.max(0, track.clientHeight - geom.height)
    const next = Math.min(max, Math.max(0, drag.top + (event.clientY - drag.y)))
    el.scrollTop = max > 0 ? (next / max) * overflow : 0
  }

  const onThumbPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = target
    const track = trackRef.current
    if (!el || !track || event.target !== track) return
    const rect = track.getBoundingClientRect()
    const overflow = el.scrollHeight - el.clientHeight
    const travel = Math.max(1, rect.height - geom.height)
    scrollTo(((event.clientY - rect.top - geom.height / 2) / travel) * overflow)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = target
    if (!el) return
    const page = el.clientHeight * 0.8
    const amount: Record<string, number> = {
      ArrowUp: -60,
      ArrowDown: 60,
      PageUp: -page,
      PageDown: page,
      Home: -el.scrollHeight,
      End: el.scrollHeight,
    }
    const delta = amount[event.key]
    if (delta === undefined) return
    event.preventDefault()
    scrollTo(el.scrollTop + delta)
  }

  return (
    <div
      ref={trackRef}
      className="modal-vscroll"
      onPointerDown={onTrackPointerDown}
      aria-hidden={geom.visible ? undefined : "true"}
    >
      {geom.visible && (
        <div
          className="modal-vscroll-thumb"
          role="scrollbar"
          aria-orientation="vertical"
          aria-label="Rolagem dos detalhes do projeto"
          aria-controls="project-details-content"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={geom.pct}
          tabIndex={0}
          style={{ height: `${geom.height}px`, transform: `translateY(${geom.top}px)` }}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerCancel={onThumbPointerUp}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';

export function CategoryScroller({ children }: { children: ReactNode }) {
  const strip = useRef<HTMLElement>(null);
  const [position, setPosition] = useState(0);
  const [overflow, setOverflow] = useState(false);

  function measure() {
    const element = strip.current;
    if (!element) return;
    const distance = element.scrollWidth - element.clientWidth;
    setOverflow(distance > 1);
    setPosition(distance > 0 ? (element.scrollLeft / distance) * 100 : 0);
  }

  useEffect(() => {
    const element = strip.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className="-mx-4 pb-3">
    <nav ref={strip} aria-label="Filtrar talentos" onScroll={measure} className="category-scroll no-scrollbar flex gap-2 px-4 py-3">{children}</nav>
    {overflow && <div className="px-4">
      <Slider thumbLabel="Rolagem das categorias" min={0} max={100} step={1} value={[position]} className="category-scrollbar h-3" onValueChange={values => {
        const element = strip.current;
        const value = values[0];
        if (!element || value === undefined) return;
        element.scrollTo({ left: (value / 100) * (element.scrollWidth - element.clientWidth), behavior: 'instant' });
        setPosition(value);
      }} />
    </div>}
  </div>;
}
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdaptiveMediaProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  video?: boolean;
  poster?: string;
}

export function AdaptiveMedia({ src, alt, width = 4, height = 3, video = false, poster }: AdaptiveMediaProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ratio, setRatio] = useState(`${width} / ${height}`);

  function ready(mediaWidth: number, mediaHeight: number) {
    if (mediaWidth > 0 && mediaHeight > 0) {
      setRatio(`${mediaWidth} / ${mediaHeight}`);
    }
    setLoaded(true);
  }

  return <div className="adaptive-media relative bg-muted" style={{ aspectRatio: ratio }}>
    {!loaded && !failed && <Skeleton className="absolute inset-0 rounded-none" />}
    {failed ? <div className="absolute inset-0 flex items-center justify-center text-sm text-body-copy">Arquivo indisponível</div> : video ?
      <video src={src} poster={poster} title={alt} width={width} height={height} className="adaptive-media-content" controls playsInline preload="metadata"
        onLoadedMetadata={event => ready(event.currentTarget.videoWidth, event.currentTarget.videoHeight)} onError={() => setFailed(true)} /> :
      <img src={src} alt={alt} width={width} height={height} loading="lazy" className="adaptive-media-content"
        onLoad={event => ready(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} onError={() => setFailed(true)} />}
  </div>;
}
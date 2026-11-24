// Use the final YouTube watch URL rather than relying on short-link redirects.
export function directMediaUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return value;
    let id: string | null = null;
    if (host === 'youtu.be' || host === 'www.youtu.be') id = url.pathname.split('/')[1] ?? null;
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split('/')[2] ?? null;
    }
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return value;
    const destination = new URL('https://www.youtube.com/watch');
    destination.searchParams.set('v', id);
    const start = url.searchParams.get('t') ?? url.searchParams.get('start');
    if (start && /^(?:\d+[hms]?)+$/.test(start)) destination.searchParams.set('t', start);
    return destination.toString();
  } catch { return value; }
}

export function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(directMediaUrl(value));
    const id = url.searchParams.get('v');
    if (url.hostname !== 'www.youtube.com' || url.pathname !== '/watch' || !id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`;
  } catch { return null; }
}

export function materialDestination(link: { type: string; url: string }, previewUrl?: string) {
  if (link.type === 'youtube' && !youtubeEmbedUrl(link.url) && previewUrl && youtubeEmbedUrl(previewUrl)) {
    return directMediaUrl(previewUrl);
  }
  return directMediaUrl(link.url);
}

export function spotifyEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['open.spotify.com'].includes(url.hostname)) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const [first = '', second = '', third = ''] = parts;
    const types = ['album', 'artist', 'track', 'playlist', 'episode', 'show'];
    if (parts.length === 2 && types.includes(first) && second && /^[A-Za-z0-9]+$/.test(second)) {
      return `https://open.spotify.com/embed/${first}/${second}`;
    }
    if (parts.length === 3 && /^intl-[a-z]{2}$/i.test(first) && types.includes(second) && third && /^[A-Za-z0-9]+$/.test(third)) {
      return `https://open.spotify.com/embed/${second}/${third}`;
    }
    return null;
  } catch { return null; }
}

export function instagramEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname)) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const [first, second] = parts;
    if (!first) return null;
    if (parts.length === 1 && /^[A-Za-z0-9._]+$/.test(first) && !['accounts', 'explore', 'direct'].includes(first)) {
      return `https://www.instagram.com/${first}/embed/`;
    }
    if (parts.length === 2 && second && ['reel', 'p'].includes(first) && /^[A-Za-z0-9_-]+$/.test(second)) {
      return `https://www.instagram.com/${first}/${second}/embed/`;
    }
    return null;
  } catch { return null; }
}
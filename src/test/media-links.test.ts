import { describe, expect, it } from 'vitest';
import { directMediaUrl, instagramEmbedUrl, materialDestination, spotifyEmbedUrl, youtubeEmbedUrl } from '@/lib/media-links';
import talents from '@/data/talents.json';

describe('Direct YouTube destinations', () => {
  it('opens the registered Deep Flow video without the short-link redirect', () => {
    expect(directMediaUrl('https://youtu.be/vlazvYQ0fmQ?si=K2QPZ9FTO2w33BOh')).toBe('https://www.youtube.com/watch?v=vlazvYQ0fmQ');
  });
  it('preserves a video timestamp while removing sharing parameters', () => {
    expect(directMediaUrl('https://youtu.be/B76T_ld-bmg?t=30&si=share')).toBe('https://www.youtube.com/watch?v=B76T_ld-bmg&t=30');
  });
  it('does not change channel links, PDF assets or unrelated hosts', () => {
    for (const value of ['https://www.youtube.com/@DaudtJogando', '/files/palco.pdf', 'https://youtu.be.example.com/vlazvYQ0fmQ']) {
      expect(directMediaUrl(value)).toBe(value);
    }
  });
});

describe('Accessible material destinations', () => {
  it('uses the matching Game Room video for Thiago’s YouTube button instead of the channel', () => {
    const talent = talents.find(value => value.id === 6);
    const link = talent?.links.find(value => value.type === 'youtube');
    expect(talent && link && 'previewUrl' in talent ? materialDestination(link, talent.previewUrl) : null).toBe('https://www.youtube.com/watch?v=B76T_ld-bmg');
  });
  it('keeps Eduardo’s PDF pointing to the actual uploaded document', () => {
    const link = talents.find(value => value.id === 5)?.links.find(value => value.type === 'pdf');
    expect(link ? materialDestination(link) : null).toBe('/__l5e/assets-v1/842aaf2c-66e3-4455-be04-f790470a7ee6/palco-diagramado-v5.pdf');
  });
  it('opens Nayane’s submitted crochet PDF rather than a restricted Drive page', () => {
    const link = talents.find(value => value.id === 7)?.links.find(value => value.type === 'pdf');
    expect(link ? materialDestination(link) : null).toBe('/__l5e/assets-v1/7d9d144f-cc53-4bf5-a0f0-23cc3256ddd3/nayane-croche.pdf');
  });
  it('embeds the registered Deep Flow video, not a blocked watch page in a frame', () => {
    expect(youtubeEmbedUrl('https://youtu.be/vlazvYQ0fmQ?si=share')).toBe('https://www.youtube-nocookie.com/embed/vlazvYQ0fmQ?rel=0&playsinline=1');
  });
  it('embeds the matching Game Room video', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=B76T_ld-bmg')).toBe('https://www.youtube-nocookie.com/embed/B76T_ld-bmg?rel=0&playsinline=1');
  });
  it('does not embed channels or unrelated destinations', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/@DaudtJogando')).toBeNull();
    expect(youtubeEmbedUrl('https://example.com/watch?v=B76T_ld-bmg')).toBeNull();
  });
});

describe('Spotify destinations', () => {
  it('opens Micaely’s Doce Veneno album through the official embeddable player', () => {
    const link = talents.find(value => value.id === 2)?.links.find(value => value.type === 'spotify');
    expect(link ? spotifyEmbedUrl(link.url) : null).toBe('https://open.spotify.com/embed/album/254z5hp8PBAyiMJW0OJfRk');
  });
  it('embeds localized album links without the locale prefix or sharing parameters', () => {
    expect(spotifyEmbedUrl('https://open.spotify.com/intl-pt/album/254z5hp8PBAyiMJW0OJfRk?si=Ykp9J6VbSOyhFrFSTdNU5Q')).toBe('https://open.spotify.com/embed/album/254z5hp8PBAyiMJW0OJfRk');
  });
  it('rejects unrelated hosts and unsupported Spotify pages', () => {
    expect(spotifyEmbedUrl('https://open.spotify.com.example.com/album/254z5hp8PBAyiMJW0OJfRk')).toBeNull();
    expect(spotifyEmbedUrl('https://open.spotify.com/search/doce%20veneno')).toBeNull();
  });
});

describe('Instagram destinations', () => {
  it('opens Daudt’s profile through the official embeddable page instead of a blocked popup', () => {
    expect(instagramEmbedUrl('https://www.instagram.com/daudtjogando')).toBe('https://www.instagram.com/daudtjogando/embed/');
  });
  it('opens the submitted Steven Spielberg reel through its official embed', () => {
    expect(instagramEmbedUrl('https://www.instagram.com/reel/DRkvT6zCd5T/')).toBe('https://www.instagram.com/reel/DRkvT6zCd5T/embed/');
  });
  it('rejects unrelated hosts and Instagram sign-in pages', () => {
    expect(instagramEmbedUrl('https://www.instagram.com.example.com/daudtjogando')).toBeNull();
    expect(instagramEmbedUrl('https://www.instagram.com/accounts/login/')).toBeNull();
  });
});
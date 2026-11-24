import { describe, expect, it } from 'vitest';
import { voterCookieOptions } from '@/lib/voting-session';

describe('Voter session cookie', () => {
  it('supports embedded HTTPS voting without exposing the session to scripts', () => {
    expect(voterCookieOptions('https://canta.example/votar')).toEqual({
      httpOnly: true, secure: true, sameSite: 'none', partitioned: true, path: '/',
    });
  });

  it('allows local HTTP checks while retaining HttpOnly protection', () => {
    expect(voterCookieOptions('http://localhost:8080/votar')).toEqual({
      httpOnly: true, secure: false, sameSite: 'lax', partitioned: false, path: '/',
    });
  });
});
// Keep the opaque session HttpOnly, including when the app is embedded cross-site.
export function voterCookieOptions(requestUrl: string | URL) {
  const secure = new URL(requestUrl).protocol === 'https:';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' as const : 'lax' as const,
    partitioned: secure,
    path: '/',
  };
}
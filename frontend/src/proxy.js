import { NextResponse } from 'next/server';

const SESSION_COOKIES = ['__Host-formflow_session', 'formflow_session'];

export function proxy(request) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = new URL('/giris', request.url);
  url.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/panel/:path*', '/formlar/:path*', '/ayarlar/:path*'],
};

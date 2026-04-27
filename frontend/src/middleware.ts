import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Récupérer les informations stockées dans les cookies (ajoutées lors du login)
  const token = request.cookies.get('ga_auth_token')?.value;
  const role = request.cookies.get('ga_auth_role')?.value;

  const url = request.nextUrl.pathname;

  // 2. Si on tente d'aller sur une page protégée SANS être connecté
  if (!token) {
    // Si on n'est pas déjà sur la page de login, on redirige
    if (!url.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 3. Vérification des Droits d'Accès (Rôles)
  
  // Si on tente d'accéder à l'espace Admin en étant simplement Adhérent ('member')
  if (url.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url)); // Redirige vers le Dashboard Adhérent
  }

  // Si on tente d'aller sur la page login alors qu'on est déjà connecté
  if (url.startsWith('/login')) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 4. Si tout est OK, on laisse passer la requête
  return NextResponse.next();
}

// Configuration pour indiquer sur quelles pages ce Middleware doit s'exécuter.
// On exclut les images, l'API et les fichiers statiques internes de Next.js
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.png, *.jpg (images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)',
  ],
};

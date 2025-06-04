import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Secret for JWT 
const secret = process.env.NEXTAUTH_SECRET || "4561c2e49d88e1f4cf06e0ad77892f8b39f8b87f6b8fb1e8a2e0e94f3698a123";

// Add a configuration object to specify the middleware paths
export const config = {
  matcher: [
    '/seller/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/main',
  ]
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token which contains user's role
  const token = await getToken({ req: request, secret });
  
  // Check if the user is authenticated
  const isAuthenticated = !!token;
  
  // Check user role
  const userRole = token?.role as string || '';
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    // If accessing protected pages, redirect to login
    if (
      pathname.startsWith('/seller') || 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/profile')
    ) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // For non-protected pages, allow access
    return NextResponse.next();
  }
  
  // Role-based redirection for authenticated users
  if (isAuthenticated) {
    // Redirect sellers trying to access buyer-only pages
    if (userRole === 'seller' && pathname === '/main') {
      return NextResponse.redirect(new URL('/seller', request.url));
    }
    
    // Redirect buyers trying to access seller-only pages
    if (userRole === 'buyer' && pathname.startsWith('/seller')) {
      return NextResponse.redirect(new URL('/main', request.url));
    }
    
    // Redirect non-admins trying to access admin-only pages
    if (userRole !== 'admin' && pathname.startsWith('/admin')) {
      const redirectUrl = userRole === 'seller' ? '/seller' : '/main';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
} 
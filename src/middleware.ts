import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'; // Removed unused clerkClient import
import { NextResponse } from 'next/server';

// Define public routes explicitly
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)', // Ensure webhook remains public
  '/courses',         // Public course listing page
  '/courses/(.*)',    // Public individual course pages
  '/api/courses(.*)', // Public API for courses
  // Add any other routes that should be accessible without login
]);

// Define admin routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)', // Protect admin API routes as well
]);

// The specific email allowed to access admin routes
const ADMIN_EMAIL = 'didier@hatoltd.com';

export default clerkMiddleware(async (auth, req) => {
  // Log the incoming request path
  console.log(`[Middleware] Request Pathname: ${req.nextUrl.pathname}`);

  // Get userId and sessionClaims from auth context
  const { userId, sessionClaims } = await auth();
  console.log("Middleware: Checking request for:", req.url);
  console.log("Middleware: userId:", userId);
  console.log("Middleware: sessionClaims:", sessionClaims); // <-- Uncommented this line

  // If accessing an admin route
  if (isAdminRoute(req)) {
    console.log("Middleware: Accessing admin route:", req.url);
    // 1. Ensure user is logged in. If not, Clerk's default behavior (redirect to sign-in) applies.
    // We add an explicit check here for clarity and fallback.
    if (!userId) {
      console.log("Middleware: No userId found for admin route, redirecting to sign-in.");
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // 2. If logged in, check if they are the designated admin user using session claims.
    try {
      // Update 'email' or 'primaryEmail' if you used a different claim name in Clerk JWT template
      const primaryEmail = sessionClaims?.primaryEmail as string | undefined ?? sessionClaims?.email as string | undefined;
      console.log("Middleware: Extracted primaryEmail from claims:", primaryEmail);

      // 3. If the user's email does not match the admin email, redirect them.
      if (primaryEmail !== ADMIN_EMAIL) {
        console.log(`Middleware: Redirecting non-admin user (${primaryEmail || userId}) from admin route.`);
        const homeUrl = new URL('/', req.url);
        return NextResponse.redirect(homeUrl);
      }
      // 4. If it's the admin user, allow access (do nothing, proceed to the route).
      console.log(`Middleware: Admin user (${primaryEmail}) granted access to admin route.`);
    } catch (error) {
      // This catch block might be less relevant now as we're not making an async call,
      // but keep it for general error handling during claim access.
      console.error("Middleware: Error processing session claims:", error);
      // Redirect if there's an unexpected error processing claims
      const homeUrl = new URL('/', req.url);
      return NextResponse.redirect(homeUrl);
    }
  }
  // For non-admin routes, protect if they are not public
  else if (!isPublicRoute(req)) {
    console.log("Middleware: Protecting non-public route:", req.url);
    auth.protect();
  } else {
    console.log("Middleware: Allowing access to public route:", req.url);
  }

  // Allow the request to proceed if none of the above conditions triggered a redirect
  return NextResponse.next();

}, { debug: false }); // Explicitly disable debug logging

export const config = {
  // Matcher logic remains the same - ensures middleware runs on relevant paths
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
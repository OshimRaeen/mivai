import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// We define our public routes here (like our beautiful landing page!)
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // If they try to access a private route (like /dashboard) and aren't logged in, redirect them
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
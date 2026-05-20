export const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
export const clerkPublishableKey = import.meta.env
  .VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export const isConvexConfigured = Boolean(convexUrl);
export const isClerkConfigured = Boolean(clerkPublishableKey);

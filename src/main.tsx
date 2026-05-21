import React, { useCallback, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import "leaflet/dist/leaflet.css";
import App from "./App";
import { clerkPublishableKey, convexUrl } from "./lib/convex";
import "./styles.css";

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL");
}

const convex = new ConvexReactClient(convexUrl);

function audienceIncludesConvex(audience: unknown) {
  if (Array.isArray(audience)) {
    return audience.includes("convex");
  }
  return audience === "convex";
}

function tokenHasConvexAudience(token: string | null) {
  if (!token) return false;
  const payload = token.split(".")[1];
  if (!payload) return false;
  try {
    const paddedPayload =
      payload.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payload.length % 4)) % 4);
    const claims = JSON.parse(atob(paddedPayload)) as { aud?: unknown };
    return audienceIncludesConvex(claims.aud);
  } catch {
    return false;
  }
}

function useClerkConvexAuth() {
  const { getToken, isLoaded, isSignedIn, orgId, orgRole, sessionClaims, sessionId } =
    useAuth();
  const audience = (sessionClaims as { aud?: unknown } | null | undefined)?.aud;
  const audienceKey = JSON.stringify(audience ?? null);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!isSignedIn) return null;
      const baseOptions = { skipCache: forceRefreshToken };

      if (audienceIncludesConvex(audience)) {
        const token = await getToken(baseOptions);
        if (token) return token;
      }

      try {
        const token = await getToken({
          template: "convex",
          skipCache: forceRefreshToken,
        });
        if (token) return token;
      } catch {
        // The Clerk Convex integration can work without a manual JWT template.
      }

      const defaultToken = await getToken(baseOptions);
      return tokenHasConvexAudience(defaultToken) ? defaultToken : null;
    },
    [audienceKey, getToken, isSignedIn, orgId, orgRole, sessionId],
  );

  return useMemo(
    () => ({
      isLoading: !isLoaded,
      isAuthenticated: isSignedIn ?? false,
      fetchAccessToken,
    }),
    [fetchAccessToken, isLoaded, isSignedIn],
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInFallbackRedirectUrl="/#profile"
      signUpFallbackRedirectUrl="/#profile"
    >
      <ConvexProviderWithAuth client={convex} useAuth={useClerkConvexAuth}>
        <App />
      </ConvexProviderWithAuth>
    </ClerkProvider>
  </React.StrictMode>,
);

import { useState } from "react";
import { supabase } from "./lib/supabase";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Supabase is not configured. Please check your .env.local file.");
      return;
    }

    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setStatus("Please enter your email and password.");
        return;
      }

      if (password.length < 6) {
        setStatus("Password must be at least 6 characters.");
        return;
      }

      const { error } = isLogin
        ? await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

      if (error) {
        setStatus(error.message);
        return;
      }

      setStatus(
        isLogin
          ? "Logged in successfully."
          : "Account created successfully. You can now use the app."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!supabase) {
      setStatus("Supabase is not configured. Please check your .env.local file.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setStatus(error.message);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100vw",
        background:
          "radial-gradient(circle at top left, rgba(251, 191, 146, 0.25), transparent 30rem), radial-gradient(circle at bottom right, rgba(255, 176, 123, 0.22), transparent 34rem), #090b12",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 430,
          background: "rgba(255, 255, 255, 0.075)",
          border: "1px solid rgba(255, 218, 191, 0.16)",
          borderRadius: 28,
          padding: 28,
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.42)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <img
            src="/everythingutm-icon.png"
            alt="EverythingUTM"
            style={{
              width: 92,
              height: 92,
              objectFit: "cover",
              borderRadius: 24,
              display: "block",
              margin: "0 auto 18px",
              boxShadow: "0 16px 40px rgba(255, 178, 127, 0.28)",
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            EverythingUTM
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "rgba(255, 255, 255, 0.68)",
              fontSize: "0.95rem",
            }}
          >
            {isLogin ? "Welcome back." : "Create your account."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          <label style={{ display: "grid", gap: 7 }}>
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.74)" }}>
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid rgba(255, 218, 191, 0.16)",
                background: "rgba(8, 11, 18, 0.92)",
                color: "#ffffff",
                borderRadius: 16,
                padding: "13px 15px",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 7 }}>
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.74)" }}>
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid rgba(255, 218, 191, 0.16)",
                background: "rgba(8, 11, 18, 0.92)",
                color: "#ffffff",
                borderRadius: 16,
                padding: "13px 15px",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </label>

          {status && (
            <p
              style={{
                margin: 0,
                borderRadius: 16,
                padding: "12px 14px",
                background: "rgba(255, 218, 191, 0.1)",
                color: "rgba(255, 255, 255, 0.86)",
                fontSize: "0.9rem",
              }}
            >
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              border: 0,
              borderRadius: 16,
              padding: "13px 15px",
              background: loading
                ? "rgba(255, 184, 138, 0.55)"
                : "linear-gradient(135deg, #ffb38a, #ffd6bd)",
              color: "#24100a",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: "100%",
              border: "1px solid rgba(255, 218, 191, 0.18)",
              borderRadius: 16,
              padding: "13px 15px",
              background: "rgba(255, 218, 191, 0.08)",
              color: "#ffffff",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Continue with Google
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isLogin ? "signup" : "login");
            setStatus("");
          }}
          style={{
            width: "100%",
            marginTop: 20,
            border: 0,
            background: "transparent",
            color: "rgba(255, 255, 255, 0.72)",
            cursor: "pointer",
            fontSize: "0.9rem",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {isLogin
            ? "No account yet? Create one"
            : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}
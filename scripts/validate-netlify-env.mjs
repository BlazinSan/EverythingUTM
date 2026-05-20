const required = ["CONVEX_DEPLOY_KEY", "VITE_CLERK_PUBLISHABLE_KEY"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(
    [
      "Missing EverythingUTM Netlify environment variables:",
      ...missing.map((name) => `- ${name}`),
      "",
      "Set them in Netlify > Site configuration > Environment variables.",
      "Convex will inject VITE_CONVEX_URL during `convex deploy`.",
      "Remove old VITE_SUPABASE_* variables; they are no longer used.",
    ].join("\n"),
  );
  process.exit(1);
}

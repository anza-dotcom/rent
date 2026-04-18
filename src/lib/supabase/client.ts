// Local-dev stub: auth is disabled. The sidebar "sign out" button is a no-op,
// and the login page's calls resolve without error so it can still render.
export function createClient() {
  return {
    auth: {
      async signOut() {
        return { error: null };
      },
      async signInWithPassword(_creds: { email: string; password: string }) {
        return { data: { user: null, session: null }, error: null };
      },
      async signInWithOtp(_opts: { email: string; options?: unknown }) {
        return { data: {}, error: null };
      },
    },
  };
}

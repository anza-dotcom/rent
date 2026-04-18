// Local-dev stub: returns a fake authenticated user so API routes work
// without Supabase. Replace with real Supabase client before production.
const LOCAL_USER = { id: "local-owner", email: "owner@localhost" };

export async function createClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: LOCAL_USER }, error: null };
      },
      async signOut() {
        return { error: null };
      },
      async exchangeCodeForSession(_code: string) {
        return { data: { session: null }, error: null };
      },
    },
  };
}

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaidLinkButton } from "@/components/payments/plaid-link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const items = await prisma.plaidItem.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Connect your business bank and sync deposits automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank connections (Plaid)</CardTitle>
          <CardDescription>
            Link your business checking account. Deposits are auto-matched to units by amount
            and tenant name. Unmatched deposits can be matched manually on the Payments page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlaidLinkButton />

          <div>
            <div className="text-sm font-medium mb-2">Linked institutions</div>
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">No bank accounts linked yet.</div>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div>
                      <div className="font-medium">
                        {it.institutionName ?? "Connected bank"}
                      </div>
                      <div className="text-xs text-muted-foreground">Item: {it.itemId}</div>
                    </div>
                    <Badge variant="success">Connected</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>
            Required env vars are documented in <code>.env.local.example</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div><code>DATABASE_URL</code> — Supabase Postgres connection string</div>
          <div><code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></div>
          <div><code>PLAID_CLIENT_ID</code> / <code>PLAID_SECRET</code> / <code>PLAID_ENV</code></div>
        </CardContent>
      </Card>
    </div>
  );
}

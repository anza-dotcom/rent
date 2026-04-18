import {
  Database,
  ShieldCheck,
  Landmark,
  Info,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaidLinkButton } from "@/components/payments/plaid-link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const items = await prisma.plaidItem.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Integrations and environment for the Speranza Properties app.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 flex items-start gap-4 border-b">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold tracking-tight">
              Bank connections
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              Connect your business checking account via Plaid. Deposits are
              auto-matched to units by amount and tenant name.
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <PlaidLinkButton />

          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
              Linked institutions
            </div>
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                No bank accounts linked yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {it.institutionName ?? "Connected bank"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Item ID: {it.itemId}
                        </div>
                      </div>
                    </div>
                    <Badge variant="success">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 flex items-start gap-4 border-b">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold tracking-tight">
              Data &amp; environment
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              Where data lives and what environment variables are required.
            </div>
          </div>
        </div>
        <div className="p-6 text-sm space-y-4">
          <div className="rounded-lg border p-4 bg-muted/20">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Local development</span>
            </div>
            <p className="text-muted-foreground">
              This app is currently running on a local SQLite database
              (<code className="text-xs bg-muted px-1 py-0.5 rounded">prisma/dev.db</code>)
              with authentication bypassed. To deploy to production, point Prisma
              at a Postgres database and re-enable the Supabase auth middleware.
            </p>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
              Environment variables (production)
            </div>
            <div className="space-y-1.5 text-muted-foreground">
              <EnvRow name="DATABASE_URL" desc="Postgres connection string" />
              <EnvRow name="NEXT_PUBLIC_SUPABASE_URL" desc="Supabase project URL" />
              <EnvRow name="NEXT_PUBLIC_SUPABASE_ANON_KEY" desc="Supabase anon key" />
              <EnvRow name="PLAID_CLIENT_ID" desc="Plaid client ID" />
              <EnvRow name="PLAID_SECRET" desc="Plaid secret" />
              <EnvRow name="PLAID_ENV" desc='"sandbox" or "production"' />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EnvRow({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{name}</code>
      <span className="text-xs text-right">{desc}</span>
    </div>
  );
}

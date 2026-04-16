"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { toast } from "sonner";
import { Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchLinkToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" });
      if (!res.ok) throw new Error("link_token failed");
      const data = await res.json();
      setLinkToken(data.link_token);
    } catch {
      toast.error("Could not create Plaid link token. Check PLAID_* env vars.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_token,
            institution_id: metadata.institution?.institution_id,
            institution_name: metadata.institution?.name,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(`Connected ${metadata.institution?.name ?? "bank"}.`);
      } catch {
        toast.error("Failed to save Plaid connection.");
      }
    },
    onExit: (err) => {
      if (err) toast.error(err.display_message ?? err.error_message ?? "Plaid exited");
    },
  });

  async function sync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "sync failed");
      toast.success(
        `Sync complete — ${data.created} payments imported (${data.matched} matched, ${data.unmatched} unmatched).`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => open()} disabled={!ready || loading || !linkToken}>
        <Building2 className="h-4 w-4" />
        {loading ? "Loading..." : "Connect bank account"}
      </Button>
      <Button variant="outline" onClick={sync} disabled={syncing}>
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        Sync transactions
      </Button>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Banknote, CreditCard, Wallet, Landmark, Link2, Coins, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn, formatMoney } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/payments";

interface Row {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  unit: string;
  property: string;
  propertyId: string;
  unitId: string;
}

interface Props {
  rows: Row[];
  properties: { id: string; address: string }[];
  initialFilters: {
    propertyId?: string;
    method?: string;
    status?: string;
    from?: string;
    to?: string;
  };
}

const methodIcons: Record<string, typeof Banknote> = {
  check: Banknote,
  wire: Landmark,
  ach: CreditCard,
  plaid: Link2,
  cash: Wallet,
  other: Coins,
};

const methodColors: Record<string, string> = {
  check: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  wire: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  ach: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  plaid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cash: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  other: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export function PaymentsTable({ rows, properties, initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const hasFilters =
    !!initialFilters.propertyId ||
    !!initialFilters.method ||
    !!initialFilters.status ||
    !!initialFilters.from ||
    !!initialFilters.to;

  function update(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div>
      <div className="p-5 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Property
            </Label>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={initialFilters.propertyId ?? ""}
              onChange={(e) => update("propertyId", e.target.value)}
            >
              <option value="">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Method
            </Label>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm capitalize"
              value={initialFilters.method ?? ""}
              onChange={(e) => update("method", e.target.value)}
            >
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Status
            </Label>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={initialFilters.status ?? ""}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              From
            </Label>
            <Input
              type="date"
              value={initialFilters.from ?? ""}
              onChange={(e) => update("from", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              To
            </Label>
            <Input
              type="date"
              value={initialFilters.to ?? ""}
              onChange={(e) => update("to", e.target.value)}
            />
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">No payments found</div>
          <div className="text-xs text-muted-foreground mt-1">
            {hasFilters
              ? "Try clearing your filters."
              : "Payments you log will appear here."}
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Unit / Tenant</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const Icon = methodIcons[r.method] ?? Coins;
              return (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm">{r.date}</TableCell>
                  <TableCell className="text-sm">{r.property}</TableCell>
                  <TableCell className="text-sm">{r.unit}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize",
                        methodColors[r.method] ?? methodColors.other
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {r.method}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.reference ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "cleared"
                          ? "success"
                          : r.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold money-num">
                    {formatMoney(r.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

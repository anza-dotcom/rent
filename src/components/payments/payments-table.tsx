"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";
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

export function PaymentsTable({ rows, properties, initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div>
      <div className="p-4 border-b grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <Label className="text-xs">Property</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={initialFilters.propertyId ?? ""}
            onChange={(e) => update("propertyId", e.target.value)}
          >
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Method</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm capitalize"
            value={initialFilters.method ?? ""}
            onChange={(e) => update("method", e.target.value)}
          >
            <option value="">All</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m} className="capitalize">
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={initialFilters.status ?? ""}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="cleared">Cleared</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={initialFilters.from ?? ""}
            onChange={(e) => update("from", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={initialFilters.to ?? ""}
            onChange={(e) => update("to", e.target.value)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No payments match these filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Unit / Tenant</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.property}</TableCell>
                <TableCell>{r.unit}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(r.amount)}
                </TableCell>
                <TableCell className="capitalize">{r.method}</TableCell>
                <TableCell className="text-muted-foreground">{r.reference ?? "—"}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Home,
  Users,
  DollarSign,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, monthBounds } from "@/lib/utils";
import { unitStatusForMonth, type UnitStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

const statusBadge: Record<
  UnitStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted" | "secondary";
  }
> = {
  paid: { label: "Paid", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  pending: { label: "Pending", variant: "secondary" },
  late: { label: "Late", variant: "destructive" },
  vacant: { label: "Vacant", variant: "muted" },
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();
  const { start, end } = monthBounds(now);

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          payments: { orderBy: { paymentDate: "desc" } },
        },
        orderBy: { unitName: "asc" },
      },
    },
  });

  if (!property) notFound();

  const unitRows = property.units.map((u) => {
    const monthPayments = u.payments.filter(
      (p) => p.paymentDate >= start && p.paymentDate < end
    );
    const s = unitStatusForMonth(u, monthPayments, now);
    return { ...u, ...s };
  });

  const total = property.units.reduce((s, u) => s + u.monthlyRent, 0);
  const collected = unitRows.reduce((s, u) => s + u.collected, 0);
  const occupied = property.units.filter(
    (u) => u.monthlyRent > 0 && u.tenantName !== "Vacant"
  ).length;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-2" size="sm">
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4" /> All properties
          </Link>
        </Button>

        <Card className="p-6 md:p-8 bg-gradient-hero">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Building
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight truncate">
                {property.address}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  {property.units.length} units
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {occupied} occupied
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatMoney(total)}/mo potential
                </span>
              </div>
            </div>
            <div className="md:text-right">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Collected · {format(now, "MMM")}
              </div>
              <div className="money-num text-3xl font-semibold tracking-tight">
                {formatMoney(collected)}
              </div>
              <div
                className={
                  "text-sm font-medium " +
                  (pct >= 90
                    ? "text-emerald-600 dark:text-emerald-400"
                    : pct >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-rose-600 dark:text-rose-400")
                }
              >
                {pct}% collected
              </div>
            </div>
          </div>
          <div className="mt-6 h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-emerald-400 to-emerald-300 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <div className="text-lg font-semibold tracking-tight">Units</div>
            <div className="text-sm text-muted-foreground">
              Status and last payment for each unit this month.
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {format(now, "MMMM yyyy")}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="text-right">Rent</TableHead>
              <TableHead className="text-right">Collected</TableHead>
              <TableHead>Last payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitRows.map((u) => {
              const b = statusBadge[u.status];
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unitName}</TableCell>
                  <TableCell className={u.tenantName === "Vacant" ? "text-muted-foreground italic" : ""}>
                    {u.tenantName}
                  </TableCell>
                  <TableCell className="text-right money-num">
                    {formatMoney(u.monthlyRent)}
                  </TableCell>
                  <TableCell className="text-right money-num">
                    {formatMoney(u.collected)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.lastPaymentAt
                      ? format(u.lastPaymentAt, "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/units/${u.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, monthBounds } from "@/lib/utils";
import { unitStatusForMonth, type UnitStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

const statusBadge: Record<UnitStatus, { label: string; variant: "success" | "warning" | "destructive" | "muted" | "secondary" }> = {
  paid: { label: "Paid", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  pending: { label: "Pending", variant: "secondary" },
  late: { label: "Late", variant: "destructive" },
  vacant: { label: "Vacant", variant: "muted" },
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();
  const { start, end } = monthBounds(now);

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
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
    return {
      ...u,
      ...s,
    };
  });

  const total = property.units.reduce((s, u) => s + u.monthlyRent, 0);
  const collected = unitRows.reduce((s, u) => s + u.collected, 0);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4" /> All properties
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{property.address}</h1>
            <p className="text-muted-foreground">
              {property.units.length} units • {formatMoney(total)}/mo potential •{" "}
              {formatMoney(collected)} collected this month
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Units</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Monthly rent</TableHead>
                <TableHead className="text-right">Collected ({format(now, "MMM")})</TableHead>
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
                    <TableCell>{u.tenantName}</TableCell>
                    <TableCell className="text-right">{formatMoney(u.monthlyRent)}</TableCell>
                    <TableCell className="text-right">{formatMoney(u.collected)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.lastPaymentAt ? format(u.lastPaymentAt, "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.variant}>{b.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/units/${u.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

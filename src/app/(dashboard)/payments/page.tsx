import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentsTable } from "@/components/payments/payments-table";

export const dynamic = "force-dynamic";

interface SearchParams {
  propertyId?: string;
  method?: string;
  status?: string;
  from?: string;
  to?: string;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const where: {
    unit?: { propertyId: string };
    method?: string;
    status?: string;
    paymentDate?: { gte?: Date; lte?: Date };
  } = {};
  if (sp.propertyId) where.unit = { propertyId: sp.propertyId };
  if (sp.method) where.method = sp.method;
  if (sp.status) where.status = sp.status;
  if (sp.from || sp.to) {
    where.paymentDate = {};
    if (sp.from) where.paymentDate.gte = new Date(sp.from);
    if (sp.to) where.paymentDate.lte = new Date(sp.to);
  }

  const [payments, properties] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { unit: { include: { property: true } } },
      orderBy: { paymentDate: "desc" },
      take: 200,
    }),
    prisma.property.findMany({ orderBy: { address: "asc" } }),
  ]);

  const rows = payments.map((p) => ({
    id: p.id,
    date: format(p.paymentDate, "MMM d, yyyy"),
    amount: p.amount,
    method: p.method,
    status: p.status,
    reference: p.reference,
    unit: `${p.unit.unitName} — ${p.unit.tenantName}`,
    property: p.unit.property.address,
    propertyId: p.unit.propertyId,
    unitId: p.unitId,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Full ledger of every rental payment across the portfolio.
          </p>
        </div>
        <Button asChild>
          <Link href="/payments/new">
            <Plus className="h-4 w-4" /> Add payment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PaymentsTable rows={rows} properties={properties} initialFilters={sp} />
        </CardContent>
      </Card>
    </div>
  );
}

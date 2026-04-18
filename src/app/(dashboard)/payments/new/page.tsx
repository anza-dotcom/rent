import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "@/components/payments/payment-form";

export const dynamic = "force-dynamic";

export default async function NewPaymentPage() {
  const properties = await prisma.property.findMany({
    include: { units: { orderBy: { unitName: "asc" } } },
    orderBy: { address: "asc" },
  });

  const options = properties.flatMap((p) =>
    p.units.map((u) => ({
      id: u.id,
      label: `${p.address} — ${u.unitName} (${u.tenantName})`,
      monthlyRent: u.monthlyRent,
    }))
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-2" size="sm">
          <Link href="/payments">
            <ArrowLeft className="h-4 w-4" /> Back to payments
          </Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Log a payment</h1>
        <p className="text-muted-foreground mt-1">
          Record a check, wire, ACH, cash, or other manual rental payment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm units={options} />
        </CardContent>
      </Card>
    </div>
  );
}

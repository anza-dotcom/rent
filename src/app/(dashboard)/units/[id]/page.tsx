import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnitEditForm } from "@/components/units/unit-edit-form";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      property: true,
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!unit) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href={`/properties/${unit.propertyId}`}>
            <ArrowLeft className="h-4 w-4" /> {unit.property.address}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {unit.unitName} <span className="text-muted-foreground font-normal">— {unit.tenantName}</span>
        </h1>
        <p className="text-muted-foreground">{formatMoney(unit.monthlyRent)} / month</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {unit.payments.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No payments recorded.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unit.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(p.paymentDate, "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(p.amount)}
                      </TableCell>
                      <TableCell className="capitalize">{p.method}</TableCell>
                      <TableCell className="text-muted-foreground">{p.reference ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "cleared"
                              ? "success"
                              : p.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit unit</CardTitle>
          </CardHeader>
          <CardContent>
            <UnitEditForm
              unit={{
                id: unit.id,
                unitName: unit.unitName,
                tenantName: unit.tenantName,
                monthlyRent: unit.monthlyRent,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

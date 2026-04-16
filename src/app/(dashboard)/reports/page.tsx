import { format, subMonths, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IncomeChart } from "@/components/reports/income-chart";
import { formatMoney, monthBounds } from "@/lib/utils";
import { unitStatusForMonth } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = new Date();

  const properties = await prisma.property.findMany({
    include: {
      units: {
        include: {
          payments: true,
        },
      },
    },
    orderBy: { address: "asc" },
  });

  // 12-month income trend
  const months: { date: Date; label: string; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = startOfMonth(subMonths(now, i));
    const { start, end } = monthBounds(d);
    months.push({ date: d, label: format(d, "MMM"), start, end });
  }

  const trend = months.map((m) => {
    let collected = 0;
    let potential = 0;
    for (const p of properties) {
      for (const u of p.units) {
        potential += u.monthlyRent;
        for (const pay of u.payments) {
          if (
            pay.paymentDate >= m.start &&
            pay.paymentDate < m.end &&
            pay.status !== "failed"
          ) {
            collected += pay.amount;
          }
        }
      }
    }
    return { month: m.label, collected: Math.round(collected), potential: Math.round(potential) };
  });

  // Per-property current month summary
  const { start, end } = monthBounds(now);
  const perProperty = properties.map((p) => {
    let monthly = 0;
    let collected = 0;
    let units = p.units.length;
    let occupied = 0;
    let vacant = 0;
    for (const u of p.units) {
      monthly += u.monthlyRent;
      if (u.monthlyRent > 0 && u.tenantName !== "Vacant") occupied++;
      else vacant++;
      const s = unitStatusForMonth(
        u,
        u.payments.filter((pp) => pp.paymentDate >= start && pp.paymentDate < end),
        now
      );
      collected += s.collected;
    }
    return {
      id: p.id,
      address: p.address,
      monthly,
      collected,
      units,
      occupied,
      vacant,
    };
  });

  // Rent roll
  const rentRoll = properties.flatMap((p) =>
    p.units.map((u) => {
      const lastPayment = u.payments
        .filter((pp) => pp.status !== "failed")
        .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
      const s = unitStatusForMonth(
        u,
        u.payments.filter((pp) => pp.paymentDate >= start && pp.paymentDate < end),
        now
      );
      return {
        property: p.address,
        unit: u.unitName,
        tenant: u.tenantName,
        rent: u.monthlyRent,
        lastPayment: lastPayment ? format(lastPayment.paymentDate, "MMM d, yyyy") : "—",
        status: s.status,
      };
    })
  );

  // Delinquency (late this month)
  const delinquent = rentRoll.filter((r) => r.status === "late");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Monthly income, rent roll, vacancy and delinquency.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income trend (12 months)</CardTitle>
          <CardDescription>Collected vs. potential rent</CardDescription>
        </CardHeader>
        <CardContent>
          <IncomeChart data={trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-property summary — {format(now, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Occupied</TableHead>
                <TableHead className="text-right">Vacant</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perProperty.map((p) => {
                const pct =
                  p.monthly > 0 ? Math.round((p.collected / p.monthly) * 100) : 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.address}</TableCell>
                    <TableCell className="text-right">{p.units}</TableCell>
                    <TableCell className="text-right">{p.occupied}</TableCell>
                    <TableCell className="text-right">{p.vacant}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.monthly)}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.collected)}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={pct >= 100 ? "success" : pct > 0 ? "warning" : "muted"}
                      >
                        {pct}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rent roll</CardTitle>
            <CardDescription>All {rentRoll.length} units</CardDescription>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Rent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentRoll.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{r.unit}</div>
                      <div className="text-xs text-muted-foreground">{r.property}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.tenant}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.rent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delinquency</CardTitle>
            <CardDescription>
              {delinquent.length} unit{delinquent.length === 1 ? "" : "s"} late this month
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {delinquent.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No delinquent units.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Last payment</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delinquent.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="font-medium">{r.unit}</div>
                        <div className="text-xs text-muted-foreground">{r.property}</div>
                      </TableCell>
                      <TableCell>{r.tenant}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.lastPayment}</TableCell>
                      <TableCell className="text-right">{formatMoney(r.rent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

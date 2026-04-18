import { format, subMonths, startOfMonth } from "date-fns";
import {
  TrendingUp,
  AlertTriangle,
  Home,
  DollarSign,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncomeChart } from "@/components/reports/income-chart";
import { cn, formatMoney, monthBounds } from "@/lib/utils";
import { unitStatusForMonth } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = new Date();
  const twelveMonthsAgo = startOfMonth(subMonths(now, 11));

  const properties = await prisma.property.findMany({
    include: {
      units: {
        include: {
          payments: {
            where: { paymentDate: { gte: twelveMonthsAgo } },
            orderBy: { paymentDate: "desc" },
          },
        },
      },
    },
    orderBy: { address: "asc" },
  });

  // 12-month trend
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
    return {
      month: m.label,
      collected: Math.round(collected),
      potential: Math.round(potential),
    };
  });

  // Current month summary
  const { start, end } = monthBounds(now);
  let monthlyTotal = 0;
  let collectedTotal = 0;
  let occupiedTotal = 0;
  let unitTotal = 0;

  const perProperty = properties.map((p) => {
    let monthly = 0;
    let collected = 0;
    const units = p.units.length;
    let occupied = 0;
    let vacant = 0;
    for (const u of p.units) {
      monthly += u.monthlyRent;
      monthlyTotal += u.monthlyRent;
      unitTotal++;
      if (u.monthlyRent > 0 && u.tenantName !== "Vacant") {
        occupied++;
        occupiedTotal++;
      } else {
        vacant++;
      }
      const s = unitStatusForMonth(
        u,
        u.payments.filter((pp) => pp.paymentDate >= start && pp.paymentDate < end),
        now
      );
      collected += s.collected;
      collectedTotal += s.collected;
    }
    return { id: p.id, address: p.address, monthly, collected, units, occupied, vacant };
  });

  // Rent roll + delinquency
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
  const delinquent = rentRoll.filter((r) => r.status === "late");

  const collectionPct =
    monthlyTotal > 0 ? Math.round((collectedTotal / monthlyTotal) * 100) : 0;
  const occupancyPct =
    unitTotal > 0 ? Math.round((occupiedTotal / unitTotal) * 100) : 0;
  const ytdCollected = trend.reduce((s, m) => s + m.collected, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Income trends, rent roll, vacancy, and delinquency across the portfolio.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="12-month income"
          value={formatMoney(ytdCollected)}
          sublabel="Last 12 months collected"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label={`Collection · ${format(now, "MMM")}`}
          value={`${collectionPct}%`}
          sublabel={`${formatMoney(collectedTotal)} of ${formatMoney(monthlyTotal)}`}
          icon={DollarSign}
          tone={
            collectionPct >= 90
              ? "success"
              : collectionPct >= 50
              ? "warning"
              : "destructive"
          }
        />
        <StatCard
          label="Occupancy"
          value={`${occupancyPct}%`}
          sublabel={`${occupiedTotal} of ${unitTotal} units`}
          icon={Home}
        />
        <StatCard
          label="Delinquent"
          value={delinquent.length.toString()}
          sublabel={`${delinquent.length === 1 ? "unit" : "units"} late this month`}
          icon={AlertTriangle}
          tone={delinquent.length > 0 ? "destructive" : "success"}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <div className="text-lg font-semibold tracking-tight">
              Income trend
            </div>
            <div className="text-sm text-muted-foreground">
              Collected vs. potential rent, rolling 12 months.
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Collected
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              Potential
            </span>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <IncomeChart data={trend} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 border-b">
          <div className="text-lg font-semibold tracking-tight">
            Per-property summary · {format(now, "MMMM yyyy")}
          </div>
          <div className="text-sm text-muted-foreground">
            Collection rate by building for the current month.
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Occupied</TableHead>
              <TableHead className="text-right">Vacant</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="text-right">Collected</TableHead>
              <TableHead className="text-right w-40">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perProperty.map((p) => {
              const pct =
                p.monthly > 0 ? Math.round((p.collected / p.monthly) * 100) : 0;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.address}</TableCell>
                  <TableCell className="text-right money-num">{p.units}</TableCell>
                  <TableCell className="text-right money-num">{p.occupied}</TableCell>
                  <TableCell className="text-right money-num">{p.vacant}</TableCell>
                  <TableCell className="text-right money-num">
                    {formatMoney(p.monthly)}
                  </TableCell>
                  <TableCell className="text-right money-num font-medium">
                    {formatMoney(p.collected)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r",
                            pct >= 90
                              ? "from-emerald-500 to-emerald-300"
                              : pct >= 50
                              ? "from-amber-500 to-amber-300"
                              : "from-rose-500 to-rose-300"
                          )}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold w-9 text-right",
                          pct >= 90
                            ? "text-emerald-600 dark:text-emerald-400"
                            : pct >= 50
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="p-5 border-b">
            <div className="text-lg font-semibold tracking-tight">Rent roll</div>
            <div className="text-sm text-muted-foreground">
              All {rentRoll.length} units in the portfolio.
            </div>
          </div>
          <div className="max-h-[500px] overflow-auto">
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
                    <TableCell>
                      <div className="font-medium text-sm">{r.unit}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.property}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-sm",
                        r.tenant === "Vacant" && "italic text-muted-foreground"
                      )}
                    >
                      {r.tenant}
                    </TableCell>
                    <TableCell className="text-right money-num">
                      {formatMoney(r.rent)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold tracking-tight">Delinquency</div>
              <div className="text-sm text-muted-foreground">
                {delinquent.length} unit{delinquent.length === 1 ? "" : "s"} late
                this month
              </div>
            </div>
            {delinquent.length > 0 && (
              <Badge variant="destructive">{delinquent.length}</Badge>
            )}
          </div>
          {delinquent.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-sm font-medium">All caught up</div>
              <div className="text-xs text-muted-foreground mt-1">
                No delinquent tenants this month.
              </div>
            </div>
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
                      <div className="font-medium text-sm">{r.unit}</div>
                      <div className="text-xs text-muted-foreground">{r.property}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.tenant}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {r.lastPayment}
                    </TableCell>
                    <TableCell className="text-right money-num">
                      {formatMoney(r.rent)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

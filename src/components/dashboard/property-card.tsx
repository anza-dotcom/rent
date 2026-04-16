import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

interface Props {
  property: {
    id: string;
    address: string;
    monthlyRent: number;
    collected: number;
    unitCount: number;
    occupiedCount: number;
  };
}

export function PropertyCard({ property }: Props) {
  const collectionPct =
    property.monthlyRent > 0
      ? Math.min(100, Math.round((property.collected / property.monthlyRent) * 100))
      : 0;
  const occupancyPct =
    property.unitCount > 0
      ? Math.round((property.occupiedCount / property.unitCount) * 100)
      : 0;

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{property.address}</div>
                <div className="text-xs text-muted-foreground">
                  {property.unitCount} units • {occupancyPct}% occupied
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Monthly rent</span>
              <span className="font-medium">{formatMoney(property.monthlyRent)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Collected</span>
              <Badge
                variant={
                  collectionPct >= 100
                    ? "success"
                    : collectionPct > 0
                    ? "warning"
                    : "muted"
                }
              >
                {formatMoney(property.collected)} ({collectionPct}%)
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${collectionPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import type { Payment, Unit } from "@prisma/client";
import { monthBounds } from "@/lib/utils";

export type UnitStatus = "paid" | "partial" | "pending" | "late" | "vacant";

export function unitStatusForMonth(
  unit: Pick<Unit, "monthlyRent">,
  payments: Pick<Payment, "amount" | "paymentDate" | "status">[],
  now: Date = new Date()
): { status: UnitStatus; collected: number; lastPaymentAt: Date | null } {
  if (unit.monthlyRent <= 0) {
    return { status: "vacant", collected: 0, lastPaymentAt: null };
  }

  const { start, end } = monthBounds(now);
  const monthPayments = payments.filter(
    (p) =>
      p.paymentDate >= start &&
      p.paymentDate < end &&
      p.status !== "failed"
  );
  const collected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const lastPaymentAt =
    payments
      .filter((p) => p.status !== "failed")
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0]
      ?.paymentDate ?? null;

  if (collected >= unit.monthlyRent) {
    return { status: "paid", collected, lastPaymentAt };
  }
  if (collected > 0) {
    return { status: "partial", collected, lastPaymentAt };
  }
  // Late after the 5th of the month
  if (now.getDate() > 5) {
    return { status: "late", collected, lastPaymentAt };
  }
  return { status: "pending", collected, lastPaymentAt };
}

export const PAYMENT_METHODS = [
  "check",
  "wire",
  "ach",
  "plaid",
  "cash",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

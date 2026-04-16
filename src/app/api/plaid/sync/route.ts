import { NextResponse } from "next/server";
import type { Transaction } from "plaid";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type MatchableUnit = {
  id: string;
  monthlyRent: number;
  tenantName: string;
  property: { address: string };
};

function matchTransactionToUnit(
  txn: Transaction,
  units: MatchableUnit[]
): string | null {
  // Deposits in Plaid are typically negative amounts. Skip non-credits.
  if (txn.amount >= 0) return null;
  const amount = Math.abs(txn.amount);
  const name = (txn.name ?? "").toLowerCase();
  const merchant = (txn.merchant_name ?? "").toLowerCase();

  // 1. Exact amount match with tenant name found in description
  let candidates = units.filter((u) => Math.abs(u.monthlyRent - amount) < 0.01);
  const byTenant = candidates.find((u) => {
    const t = u.tenantName.toLowerCase();
    if (!t || t === "unknown" || t === "vacant") return false;
    const token = t.split(/[\s,]+/)[0];
    return token.length >= 3 && (name.includes(token) || merchant.includes(token));
  });
  if (byTenant) return byTenant.id;

  // 2. Exact amount match + unique
  if (candidates.length === 1) return candidates[0].id;

  // 3. Within $5 tolerance + unique
  candidates = units.filter((u) => Math.abs(u.monthlyRent - amount) <= 5);
  if (candidates.length === 1) return candidates[0].id;

  return null;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.plaidItem.findMany();
  if (items.length === 0) {
    return NextResponse.json({ error: "No linked bank accounts" }, { status: 400 });
  }

  const units = await prisma.unit.findMany({
    where: { monthlyRent: { gt: 0 } },
    include: { property: true },
  });

  let created = 0;
  let matched = 0;
  let unmatched = 0;

  for (const item of items) {
    let cursor = item.cursor ?? undefined;
    let hasMore = true;
    const added: Transaction[] = [];
    const modified: Transaction[] = [];

    while (hasMore) {
      const res = await plaidClient.transactionsSync({
        access_token: item.accessToken,
        cursor,
      });
      added.push(...res.data.added);
      modified.push(...res.data.modified);
      hasMore = res.data.has_more;
      cursor = res.data.next_cursor;
    }

    for (const txn of [...added, ...modified]) {
      if (txn.amount >= 0) continue; // outflows / debits
      const existing = await prisma.payment.findFirst({
        where: { reference: txn.transaction_id, method: "plaid" },
      });
      if (existing) continue;

      const unitId = matchTransactionToUnit(txn, units);
      if (unitId) matched++;
      else unmatched++;

      if (unitId) {
        await prisma.payment.create({
          data: {
            unitId,
            amount: Math.abs(txn.amount),
            paymentDate: new Date(txn.date),
            method: "plaid",
            status: txn.pending ? "pending" : "cleared",
            reference: txn.transaction_id,
            notes: `Auto-imported: ${txn.name}${txn.merchant_name ? ` (${txn.merchant_name})` : ""}`,
          },
        });
        created++;
      }
    }

    await prisma.plaidItem.update({
      where: { id: item.id },
      data: { cursor: cursor ?? null },
    });
  }

  return NextResponse.json({ ok: true, created, matched, unmatched });
}

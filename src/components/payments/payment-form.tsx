"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHODS } from "@/lib/payments";

interface UnitOption {
  id: string;
  label: string;
  monthlyRent: number;
}

interface Props {
  units: UnitOption[];
}

export function PaymentForm({ units }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({
    unitId: units[0]?.id ?? "",
    amount: units[0]?.monthlyRent ?? 0,
    paymentDate: today,
    method: "check",
    status: "cleared",
    reference: "",
    notes: "",
  });

  function onUnitChange(unitId: string) {
    const u = units.find((x) => x.id === unitId);
    setForm((f) => ({ ...f, unitId, amount: u?.monthlyRent ?? f.amount }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save payment.");
      return;
    }
    toast.success("Payment recorded");
    router.push("/payments");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <select
          id="unit"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.unitId}
          onChange={(e) => onUnitChange(e.target.value)}
          required
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Payment date</Label>
          <Input
            id="date"
            type="date"
            value={form.paymentDate}
            onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="method">Method</Label>
          <select
            id="method"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m} className="capitalize">
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference (check #, wire ref, etc.)</Label>
        <Input
          id="reference"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving..." : "Save payment"}
      </Button>
    </form>
  );
}

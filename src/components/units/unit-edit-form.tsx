"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  unit: {
    id: string;
    unitName: string;
    tenantName: string;
    monthlyRent: number;
  };
}

export function UnitEditForm({ unit }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(unit);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/units/${unit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitName: form.unitName,
        tenantName: form.tenantName,
        monthlyRent: Number(form.monthlyRent),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to update unit");
      return;
    }
    toast.success("Unit updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="unitName">Unit name</Label>
        <Input
          id="unitName"
          value={form.unitName}
          onChange={(e) => setForm({ ...form, unitName: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenantName">Tenant</Label>
        <Input
          id="tenantName"
          value={form.tenantName}
          onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="monthlyRent">Monthly rent</Label>
        <Input
          id="monthlyRent"
          type="number"
          step="0.01"
          min="0"
          value={form.monthlyRent}
          onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

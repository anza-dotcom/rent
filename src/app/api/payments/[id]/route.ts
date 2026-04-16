import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const UpdateSchema = z.object({
  unitId: z.string().optional(),
  amount: z.number().positive().optional(),
  paymentDate: z.string().optional(),
  method: z.string().optional(),
  status: z.string().optional(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { paymentDate, ...rest } = parsed.data;

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      ...rest,
      ...(paymentDate ? { paymentDate: new Date(paymentDate) } : {}),
    },
  });
  return NextResponse.json(payment);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.payment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

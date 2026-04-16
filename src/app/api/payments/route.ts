import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const CreateSchema = z.object({
  unitId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().min(1),
  method: z.string().min(1),
  status: z.string().default("pending"),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    include: { unit: { include: { property: true } } },
    orderBy: { paymentDate: "desc" },
    take: 500,
  });
  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { paymentDate, reference, notes, ...rest } = parsed.data;
  const payment = await prisma.payment.create({
    data: {
      ...rest,
      paymentDate: new Date(paymentDate),
      reference: reference || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(payment, { status: 201 });
}

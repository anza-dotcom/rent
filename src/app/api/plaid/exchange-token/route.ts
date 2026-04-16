import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  public_token: z.string(),
  institution_name: z.string().optional(),
  institution_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const exchange = await plaidClient.itemPublicTokenExchange({
      public_token: parsed.data.public_token,
    });

    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;

    await prisma.plaidItem.upsert({
      where: { itemId: item_id },
      update: { accessToken: access_token },
      create: {
        itemId: item_id,
        accessToken: access_token,
        institutionId: parsed.data.institution_id,
        institutionName: parsed.data.institution_name,
      },
    });

    return NextResponse.json({ ok: true, item_id });
  } catch (err) {
    console.error("Plaid exchange error", err);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}

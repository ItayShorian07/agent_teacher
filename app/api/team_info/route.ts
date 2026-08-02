import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    group_batch_order_number: process.env.GROUP_BATCH_ORDER_NUMBER || "TBD_TBD",
    team_name: process.env.TEAM_NAME || "Adaptive AI Teacher",
    students: [
      { name: "Batel Shuminov", email: process.env.BATEL_EMAIL || "batel@example.com" },
      { name: "Itay Shorian", email: process.env.ITAY_EMAIL || "itay@example.com" },
      { name: "Boaz Cohen", email: process.env.BOAZ_EMAIL || "boaz@example.com" },
    ],
  });
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computedHex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computedHex === signature;
}

serve(async (req) => {
  try {
    const signature = req.headers.get("signature");
    const rawBody = await req.text();
    const secret = Deno.env.get("CHARGILY_SECRET_KEY") ?? "";

    if (!signature || !(await verifySignature(rawBody, signature, secret))) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), { status: 403 });
    }

    const event = JSON.parse(rawBody);

    // عند نجاح الدفع عبر البطاقة الذهبية أو CIB
    if (event.type === "checkout.paid") {
      const checkout = event.data;
      const orderId = checkout.metadata?.order_id;

      if (orderId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        await supabaseAdmin
          .from("orders")
          .update({
            status: "confirmed",
            note: `تم الدفع بنجاح عبر Chargily Pay (رقم العملية: ${checkout.id})`,
          })
          .eq("id", orderId);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});

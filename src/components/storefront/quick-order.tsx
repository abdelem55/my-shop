import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/storefront/checkout-panels";
import { CopyBox } from "@/components/storefront/copy-box";
import { EMPTY_CHECKOUT_FORM, toCustomer, type CheckoutForm } from "@/lib/checkout-form";
import { formatDzd } from "@/lib/format";
import { useI18n } from "@/lib/i18n-context";
import { placeOrder } from "@/lib/order";
import { useStoreSettings, type CatalogueVariant } from "@/lib/queries";
import { getSupabase } from "@/lib/supabase/client";

export function QuickOrder({
  selected,
  quantity,
}: {
  selected: CatalogueVariant;
  quantity: number;
}) {
  const { t, locale } = useI18n();
  const { data: settings } = useStoreSettings();
  const [form, setForm] = useState<CheckoutForm>(EMPTY_CHECKOUT_FORM);
  const [paymentMethod, setPaymentMethod] = useState<"edahabia" | "cib">("edahabia");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);

  if (placed) return <QuickOrderPlaced token={placed} phone={form.phone} />;
  if (settings && !settings.accepts_cod) return null;

  const subtotal = selected.price * quantity;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const customerData = toCustomer({
      ...form,
      note: `الدفع: ${paymentMethod.toUpperCase()} | الإيميل: ${form.address} ${form.note ? `| ${form.note}` : ""}`,
    });

    const result = await placeOrder(customerData, [{ variant_id: selected.id, quantity }]);

    if (result.error || !result.token) {
      setSubmitting(false);
      setError(
        result.code
          ? t(`checkout.error.${result.code}`)
          : (result.error ?? t("common.somethingWrong")),
      );
      return;
    }

    // استدعاء دالة Supabase Edge Function لإنشاء رابط الدفع في Chargily Pay
    try {
      const { data: checkoutData, error: fnError } = await getSupabase().functions.invoke(
        "create-chargily-checkout",
        {
          body: {
            public_token: result.token,
            amount: subtotal,
            customer_name: form.customer_name,
            phone: form.phone,
            email: form.address,
            payment_method: paymentMethod,
            description: `اشتراك رقمي (#${result.token.slice(0, 8)})`,
          },
        }
      );

      if (!fnError && checkoutData?.checkout_url) {
        window.location.href = checkoutData.checkout_url;
        return;
      }
    } catch {
      // في حال لم يتم تفعيل دالة Edge Function بعد، نعرض صفحة نجاح الطلب مع رمز التتبع
    }

    setSubmitting(false);
    setPlaced(result.token);
  };

  const row = (label: string, value: string, strong = false) => (
    <div
      className={strong ? "flex justify-between text-base font-semibold" : "flex justify-between"}
    >
      <dt className={strong ? undefined : "text-on-surface-muted"}>{label}</dt>
      <dd className="font-mono" dir="ltr">
        {value}
      </dd>
    </div>
  );

  return (
    <form
      id="order-form"
      onSubmit={submit}
      className="flex scroll-mt-24 flex-col gap-4 border-t border-outline pt-5"
    >
      <h2 className="font-display text-lg font-semibold">
        {locale === "ar" ? "شراء فوري واستلام رقمي" : t("quick.title")}
      </h2>

      <AddressFields form={form} onChange={setForm} />

      <div className="flex flex-col gap-2 rounded-[16px] border border-outline bg-surface p-4">
        <span className="text-sm font-medium">
          {locale === "ar" ? "اختر بطاقة الدفع (Chargily Pay)" : "Mode de paiement (Chargily Pay)"}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("edahabia")}
            className={`rounded-[10px] border p-3 text-sm font-semibold transition ${
              paymentMethod === "edahabia"
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline hover:border-primary/40"
            }`}
          >
            {locale === "ar" ? "البطاقة الذهبية (EDAHABIA)" : "EDAHABIA"}
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("cib")}
            className={`rounded-[10px] border p-3 text-sm font-semibold transition ${
              paymentMethod === "cib"
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline hover:border-primary/40"
            }`}
          >
            {locale === "ar" ? "بطاقة CIB" : "Carte CIB"}
          </button>
        </div>
      </div>

      <dl className="flex flex-col gap-2 rounded-[12px] bg-surface-mid p-4 text-sm">
        {row(t("cart.subtotal"), formatDzd(subtotal, locale))}
        {row(
          locale === "ar" ? "التسليم الرقمي" : "Livraison numérique",
          locale === "ar" ? "مجاني (0 د.ج)" : "Gratuit (0 DZD)"
        )}
        {row(t("common.total"), formatDzd(subtotal, locale), true)}
      </dl>

      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="berry" size="lg" disabled={submitting}>
        {submitting
          ? t("checkout.placing")
          : locale === "ar"
            ? `ادفع الآن (${formatDzd(subtotal, locale)}) عبر Chargily Pay`
            : `Payer (${formatDzd(subtotal, locale)}) via Chargily Pay`}
      </Button>
    </form>
  );
}

function QuickOrderPlaced({ token, phone }: { token: string; phone: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-4 rounded-[16px] border border-outline bg-surface p-6 text-center">
      <CheckCircle2 size={36} className="text-positive" aria-hidden="true" />
      <h2 className="font-display text-xl font-semibold">{t("checkout.orderPlaced")}</h2>
      <p className="text-sm text-on-surface-muted">{t("checkout.orderPlacedBody", { phone })}</p>
      <div className="flex w-full flex-col gap-2 text-start">
        <p className="text-sm font-medium">{t("order.copyHint")}</p>
        <CopyBox value={token} />
      </div>
      <Button asChild size="lg">
        <Link to="/order/$token" params={{ token }}>
          {t("checkout.trackNow")}
        </Link>
      </Button>
    </div>
  );
}

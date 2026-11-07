import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { StoreLayout } from "@/components/storefront/store-layout";
import { CopyBox } from "@/components/storefront/copy-box";
import { AddressFields, CheckoutSummary, CodNotice } from "@/components/storefront/checkout-panels";
import { EMPTY_CHECKOUT_FORM, toCustomer, type CheckoutForm } from "@/lib/checkout-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useCart } from "@/lib/cart";
import { translate } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { isDemoShop } from "@/components/storefront/demo-banner";
import { placeOrder } from "@/lib/order";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: ({ match }) => ({ meta: [{ title: translate(match.context.locale, "checkout.title") }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t } = useI18n();
  const cart = useCart();
  const { data: settings } = useStoreSettings();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_CHECKOUT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedToken, setPlacedToken] = useState<string | null>(null);

  if (placedToken) return <OrderPlaced token={placedToken} phone={form.phone} />;

  if (settings && !settings.accepts_cod) {
    return <NothingToCheckOut title={t("shop.closed")} body={t("shop.closedBody")} />;
  }
  if (cart.items.length === 0) return <NothingToCheckOut title={t("cart.empty")} />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await placeOrder(
      toCustomer(form),
      cart.items.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
    );
    if (result.error || !result.token) {
      setSubmitting(false);
      setError(
        result.code
          ? t(`checkout.error.${result.code}`)
          : (result.error ?? t("common.somethingWrong")),
      );
      return;
    }

    try {
      const { data: checkoutData, error: fnError } = await getSupabase().functions.invoke(
        "create-chargily-checkout",
        {
          body: {
            public_token: result.token,
            amount: cart.subtotal,
            customer_name: form.customer_name,
            phone: form.phone,
            email: form.address,
            payment_method: "edahabia",
            description: `طلب اشتراكات رقمية (#${result.token.slice(0, 8)})`,
          },
        }
      );

      if (!fnError && checkoutData?.checkout_url) {
        cart.clear();
        window.location.href = checkoutData.checkout_url;
        return;
      }
    } catch {
      // المتابعة لصفحة تأكيد الطلب
    }

    setSubmitting(false);
    cart.clear();
    setPlacedToken(result.token);
  };

  return (
    <StoreLayout>
      <div className="container-page py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-on-surface-muted hover:text-on-surface"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
          {t("cart.continueShopping")}
        </Link>

        <h1 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">
          {t("checkout.title")}
        </h1>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-5">
            {isDemoShop && (
              <p
                role="note"
                className="rounded-[10px] border border-tertiary/40 bg-tertiary/10 px-4 py-3 text-sm font-medium"
              >
                {t("demo.checkout")}
              </p>
            )}
            <AddressFields form={form} onChange={setForm} />
            <CodNotice />
          </div>

          <div>
            <CheckoutSummary
              subtotal={cart.subtotal}
              deliveryFee={0}
              hasWilaya={true}
              submitting={submitting}
              error={error}
            />
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}

function OrderPlaced({ token, phone }: { token: string; phone: string }) {
  const { t } = useI18n();
  return (
    <StoreLayout>
      <div className="container-page py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <CheckCircle2 size={56} className="text-primary" />
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("checkout.successTitle")}
          </h1>
          <p className="text-on-surface-muted">{t("checkout.successMessage", { phone })}</p>
          <div className="mt-2 w-full text-start">
            <CopyBox label={t("checkout.tokenLabel")} value={token} />
          </div>
          <p className="text-xs text-on-surface-muted">{t("checkout.tokenHint")}</p>
          <Button asChild className="mt-4">
            <Link to="/">{t("cart.continueShopping")}</Link>
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}

function NothingToCheckOut({ title, body }: { title: string; body?: string }) {
  const { t } = useI18n();
  return (
    <StoreLayout>
      <div className="container-page py-16 text-center">
        <EmptyState title={title} description={body} actionLabel={t("cart.continueShopping")} actionTo="/" />
      </div>
    </StoreLayout>
  );
}

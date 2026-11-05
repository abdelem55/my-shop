import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import type { CheckoutForm } from "@/lib/checkout-form";

export function AddressFields({
  form,
  onChange,
}: {
  form: CheckoutForm;
  onChange: (next: CheckoutForm) => void;
}) {
  const { t, locale } = useI18n();
  const set = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) =>
    onChange({ ...form, [key]: value, wilaya: "Alger", commune: "Digital" });

  const emailLabel =
    locale === "ar"
      ? "البريد الإلكتروني (لتفعيل الاشتراك أو استلام الحساب)"
      : locale === "fr"
        ? "Adresse E-mail (pour recevoir l'abonnement)"
        : "Email Address (for subscription delivery)";

  const whatsappLabel =
    locale === "ar"
      ? "رقم الهاتف (واتساب للتواصل السريع)"
      : locale === "fr"
        ? "Numéro de téléphone (WhatsApp)"
        : "Phone Number (WhatsApp)";

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-outline bg-surface p-6">
      <h2 className="font-display text-lg font-semibold">{t("checkout.yourInfo")}</h2>

      <Field label={t("checkout.fullName")} required>
        <Input
          value={form.customer_name}
          onChange={(e) => set("customer_name", e.target.value)}
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </Field>

      <Field label={whatsappLabel} required>
        <Input
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder="0555 12 34 56"
          required
          pattern="[0-9+\s\-]{8,20}"
        />
      </Field>

      <Field label={emailLabel} required>
        <Input
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="example@gmail.com"
          required
          minLength={5}
          maxLength={500}
        />
      </Field>

      <Field label={t("checkout.note")}>
        <Textarea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder={
            locale === "ar"
              ? "مثال: الدفع عبر البطاقة الذهبية / أريد التفعيل على حسابي..."
              : ""
          }
          maxLength={1000}
          rows={2}
        />
      </Field>
    </div>
  );
}

export function CodNotice() {
  const { locale } = useI18n();
  return (
    <p className="flex items-start gap-3 rounded-[16px] border border-primary/30 bg-primary/5 p-4 text-sm">
      <CreditCard size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <span>
        <strong className="block font-medium">
          {locale === "ar"
            ? "دفع إلكتروني آمن عبر البطاقة الذهبية و CIB (Chargily Pay)"
            : "Paiement sécurisé via EDAHABIA & CIB (Chargily Pay)"}
        </strong>
        <span className="text-on-surface-muted">
          {locale === "ar"
            ? "تسليم رقمي فوري للاشتراك مباشرة بعد تأكيد الدفع (بدون رسوم توصيل)."
            : "Livraison numérique instantanée après paiement (0 DZD frais de livraison)."}
        </span>
      </span>
    </p>
  );
}

export function CheckoutSummary({
  error,
  submitting,
}: {
  deliveryFee?: number;
  hasWilaya?: boolean;
  subtotal?: number;
  deliverySource?: string;
  error: string | null;
  submitting: boolean;
}) {
  const { t, locale } = useI18n();
  const { items, subtotal } = useCart();

  return (
    <aside className="flex flex-col gap-4 self-start rounded-[16px] border border-outline bg-surface p-6 lg:sticky lg:top-24">
      <h2 className="font-display text-lg font-semibold">{t("checkout.summary")}</h2>

      <ul className="flex flex-col gap-3">
        {items.map((line) => (
          <li key={line.variantId} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="line-clamp-2">{line.name}</span>
              <span className="block text-xs text-on-surface-muted">
                {line.variantLabel} × {line.quantity}
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs" dir="ltr">
              {formatDzd(line.unitPrice * line.quantity, locale)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-2 border-t border-outline pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-on-surface-muted">
            {locale === "ar" ? "التسليم الرقمي" : "Livraison numérique"}
          </dt>
          <dd className="font-mono text-positive font-semibold" dir="ltr">
            {locale === "ar" ? "مجاني (0 د.ج)" : "Gratuit (0 DZD)"}
          </dd>
        </div>
        <div className="flex justify-between border-t border-outline pt-2 text-base font-semibold">
          <dt>{t("common.total")}</dt>
          <dd className="font-mono text-primary" dir="ltr">
            {formatDzd(subtotal, locale)}
          </dd>
        </div>
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
            ? "ادفع الآن عبر Chargily Pay"
            : "Payer avec Chargily Pay"}
      </Button>
    </aside>
  );
}

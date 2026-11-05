import { useI18n } from "@/lib/i18n-context";
import type { ColourOption, SizeOption } from "@/lib/variant-options";
import { cn } from "@/lib/utils";

export function ColourPicker({
  colours,
  selected,
  onSelect,
}: {
  colours: ColourOption[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const { locale } = useI18n();
  if (colours.length === 0) return null;

  const label =
    locale === "ar" ? "نوع الحساب / التفعيل" : locale === "fr" ? "Type de compte" : "Account Type";

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm">
        <span className="text-on-surface-muted">{label}: </span>
        <span className="font-semibold">{selected}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {colours.map((colour) => (
          <button
            key={colour.name}
            type="button"
            onClick={() => onSelect(colour.name)}
            aria-pressed={colour.name === selected}
            className={cn(
              "size-chip px-3 py-1.5",
              colour.name === selected && "active",
              !colour.inStock && "opacity-50 line-through"
            )}
          >
            {colour.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function SizePicker({
  sizes,
  selected,
  onSelect,
}: {
  sizes: SizeOption[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const { locale } = useI18n();
  if (sizes.length === 0) return null;

  const label =
    locale === "ar" ? "مدة الاشتراك" : locale === "fr" ? "Durée d'abonnement" : "Duration";

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm">
        <span className="text-on-surface-muted">{label}: </span>
        <span className="font-semibold">{selected}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size.name}
            type="button"
            onClick={() => onSelect(size.name)}
            disabled={!size.inStock}
            aria-pressed={size.name === selected}
            className={cn("size-chip px-3 py-1.5", size.name === selected && "active")}
          >
            {size.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

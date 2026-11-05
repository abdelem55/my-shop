import type { DeliveryMethod } from "./delivery";

export type CheckoutForm = {
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  note: string;
  delivery_method: DeliveryMethod;
  stopdesk_id: string;
  stopdesk_name: string;
};

export const EMPTY_CHECKOUT_FORM: CheckoutForm = {
  customer_name: "",
  phone: "",
  wilaya: "Alger",
  commune: "Digital",
  address: "",
  note: "",
  delivery_method: "home",
  stopdesk_id: "",
  stopdesk_name: "",
};

export function toCustomer(form: CheckoutForm) {
  return {
    customer_name: form.customer_name,
    phone: form.phone,
    wilaya: form.wilaya || "Alger",
    commune: form.commune || "Digital",
    address: form.address, // يحمل البريد الإلكتروني للزبون
    note: form.note || null,
    delivery_method: "home" as const,
    stopdesk_id: null,
    stopdesk_name: null,
  };
}

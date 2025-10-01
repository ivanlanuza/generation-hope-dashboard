"use client";

export const nf = new Intl.NumberFormat("en-US");

export const currencyPHP0 = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export const currencyPH = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

export function formatInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString() : "";
}

export function formatMoney0(v) {
  const n = Number(v || 0);
  return currencyPHP0.format(n);
}

export function formatMoney2(v) {
  const n = Number(v || 0);
  return currencyPH.format(n);
}

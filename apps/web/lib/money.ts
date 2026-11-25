const f = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 2,
});

export const formatMoney = (cents: number) => f.format(cents / 100);

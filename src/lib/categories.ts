export const CATEGORIES = [
  "Electronics",
  "ID Cards & Documents",
  "Wallets & Money",
  "Keys",
  "Bags & Backpacks",
  "Clothing",
  "Books & Notes",
  "Water Bottles",
  "Jewelry & Watches",
  "Accessories",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

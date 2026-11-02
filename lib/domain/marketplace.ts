export const MARKETPLACE_CATEGORIES = [
  "Crop residue",
  "Animal manure",
  "Agricultural processing waste",
  "Compost",
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];
export type ListingUnit = "kg" | "tonne" | "bag";
export type ListingStatus = "active" | "paused" | "sold_out";

export interface CatalogueProduct {
  id: string;
  name: string;
  category: MarketplaceCategory;
  description: string;
  icon: string;
}

export interface SellerListing {
  id: string;
  productId: CatalogueProduct["id"];
  seller: {
    id: string;
    name: string;
    location: string;
    email: string;
  };
  quantityAvailable: number;
  unit: ListingUnit;
  pricePerUnit: number;
  condition: string;
  availableFrom: string;
  availableUntil: string;
  status: ListingStatus;
}

export interface MarketplaceListing extends SellerListing {
  product: CatalogueProduct;
}

export function isAvailableListing(listing: SellerListing): boolean {
  return listing.status === "active" && listing.quantityAvailable > 0;
}

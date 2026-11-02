import {
  isAvailableListing,
  type CatalogueProduct,
  type MarketplaceListing,
  type SellerListing,
} from "@/lib/domain/marketplace";

export const catalogueProducts: CatalogueProduct[] = [
  {
    id: "maize-stalks",
    name: "Maize stalks",
    category: "Crop residue",
    description: "Dried maize stalks suitable for animal feed and mulching.",
    icon: "🌾",
  },
  {
    id: "rice-husks",
    name: "Rice husks",
    category: "Crop residue",
    description: "Lightweight rice milling by-product for compost and bedding.",
    icon: "🌱",
  },
  {
    id: "poultry-manure",
    name: "Poultry manure",
    category: "Animal manure",
    description: "A nutrient-rich soil amendment from poultry farms.",
    icon: "🐔",
  },
  {
    id: "dairy-manure",
    name: "Dairy manure",
    category: "Animal manure",
    description: "Farmyard manure for composting and soil improvement.",
    icon: "🐄",
  },
  {
    id: "coffee-husks",
    name: "Coffee husks",
    category: "Agricultural processing waste",
    description: "Coffee processing by-product for compost and mulch.",
    icon: "☕",
  },
  {
    id: "sugarcane-bagasse",
    name: "Sugarcane bagasse",
    category: "Agricultural processing waste",
    description: "Fibrous sugarcane residue for composting and other uses.",
    icon: "🌿",
  },
];

const sellerListings: SellerListing[] = [
  {
    id: "listing-maize-kitale",
    productId: "maize-stalks",
    seller: { id: "seller-wanjiku", name: "Wanjiku Farm", location: "Kitale, Trans-Nzoia", email: "hello@wanjikufarm.example" },
    quantityAvailable: 500,
    unit: "kg",
    pricePerUnit: 3,
    condition: "Dry and bundled",
    availableFrom: "2026-10-28",
    availableUntil: "2026-12-15",
    status: "active",
  },
  {
    id: "listing-maize-eldoret",
    productId: "maize-stalks",
    seller: { id: "seller-cherono", name: "Cherono Family Farm", location: "Eldoret, Uasin Gishu", email: "farm@cheronofamily.example" },
    quantityAvailable: 1.5,
    unit: "tonne",
    pricePerUnit: 2800,
    condition: "Sun-dried, loose",
    availableFrom: "2026-10-25",
    availableUntil: "2026-12-01",
    status: "active",
  },
  {
    id: "listing-rice-kirinyaga",
    productId: "rice-husks",
    seller: { id: "seller-mwangi", name: "Mwea Growers Co-op", location: "Mwea, Kirinyaga", email: "orders@mweagrowers.example" },
    quantityAvailable: 20,
    unit: "bag",
    pricePerUnit: 250,
    condition: "Clean and dry",
    availableFrom: "2026-11-01",
    availableUntil: "2027-01-15",
    status: "active",
  },
  {
    id: "listing-poultry-eldoret",
    productId: "poultry-manure",
    seller: { id: "seller-kiptoo", name: "Green Ridge Poultry", location: "Eldoret, Uasin Gishu", email: "sales@greenridge.example" },
    quantityAvailable: 35,
    unit: "bag",
    pricePerUnit: 450,
    condition: "Composted and ready to use",
    availableFrom: "2026-10-30",
    availableUntil: "2026-12-31",
    status: "active",
  },
  {
    id: "listing-dairy-nakuru",
    productId: "dairy-manure",
    seller: { id: "seller-njeri", name: "Njeri's Dairy", location: "Nakuru, Nakuru County", email: "farm@njerisdairy.example" },
    quantityAvailable: 0,
    unit: "tonne",
    pricePerUnit: 1800,
    condition: "Fresh farmyard manure",
    availableFrom: "2026-10-20",
    availableUntil: "2026-11-30",
    status: "sold_out",
  },
  {
    id: "listing-coffee-nyeri",
    productId: "coffee-husks",
    seller: { id: "seller-kamau", name: "Kamau Coffee Works", location: "Othaya, Nyeri", email: "hello@kamaucoffee.example" },
    quantityAvailable: 800,
    unit: "kg",
    pricePerUnit: 8,
    condition: "Dry, unprocessed husks",
    availableFrom: "2026-10-29",
    availableUntil: "2027-01-01",
    status: "active",
  },
  {
    id: "listing-bagasse-kakamega",
    productId: "sugarcane-bagasse",
    seller: { id: "seller-otieno", name: "Mumias Cane Collective", location: "Mumias, Kakamega", email: "trade@mumiascane.example" },
    quantityAvailable: 0.8,
    unit: "tonne",
    pricePerUnit: 3200,
    condition: "Fresh from processing",
    availableFrom: "2026-10-31",
    availableUntil: "2026-11-20",
    status: "paused",
  },
];

export function getAvailableListings(): MarketplaceListing[] {
  const productsById = new Map(catalogueProducts.map((product) => [product.id, product]));

  return sellerListings.flatMap((listing) => {
    if (!isAvailableListing(listing)) {
      return [];
    }

    const product = productsById.get(listing.productId);
    if (!product) {
      throw new Error(`Listing ${listing.id} references an unknown catalogue product.`);
    }

    return [{ ...listing, product }];
  });
}

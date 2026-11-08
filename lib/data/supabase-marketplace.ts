import { getAvailableListings } from "@/lib/data/marketplace";
import type { MarketplaceListing } from "@/lib/domain/marketplace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  if (!isSupabaseConfigured()) {
    return getAvailableListings();
  }

  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: listings, error } = await supabase
    .from("seller_listings")
    .select("id, seller_id, seller_name, product_id, quantity_available, unit, price_per_unit, location, condition, available_from, available_until, status")
    .eq("status", "active")
    .gt("quantity_available", 0)
    .gte("available_until", today)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load marketplace listings: ${error.message}`);
  }
  if (listings.length === 0) {
    return [];
  }

  const productIds = [...new Set(listings.map((listing) => listing.product_id))];
  const { data: products, error: productsError } = await supabase
    .from("catalogue_products")
    .select("id, name, category, description, icon, is_active")
    .in("id", productIds);

  if (productsError) {
    throw new Error(`Could not load marketplace products: ${productsError.message}`);
  }

  const productsById = new Map(
    products
      .filter((product) => product.is_active)
      .map((product) => [product.id, product]),
  );

  return listings.flatMap((listing) => {
    const product = productsById.get(listing.product_id);

    if (!product) {
      return [];
    }

    return [{
      id: listing.id,
      productId: listing.product_id,
      seller: {
        id: listing.seller_id,
        name: listing.seller_name,
        location: listing.location,
      },
      quantityAvailable: listing.quantity_available,
      unit: listing.unit,
      pricePerUnit: listing.price_per_unit,
      condition: listing.condition,
      availableFrom: listing.available_from,
      availableUntil: listing.available_until,
      status: listing.status,
      product,
    }];
  });
}

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SearchSellerArguments = {
  product?: string;
  location?: string;
  min_quantity?: number;
  available_on?: string;
};

export type SearchSellerListing = {
  id: string;
  seller_id: string;
  seller_name: string;
  quantity_available: number;
  unit: string;
  price_per_unit: number;
  location: string;
  condition: string;
  available_from: string;
  available_until: string;
  status: string;
  catalogue_products: {
    name: string;
    category: string;
    description: string;
  } | null;
};

function getKenyanDate(): string {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    dateParts.map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function parseSearchSellerArguments(
  value: unknown
): SearchSellerArguments {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid search parameters.");
  }

  const args = value as Record<string, unknown>;

  if (
    args.product !== undefined &&
    (typeof args.product !== "string" || args.product.length > 100)
  ) {
    throw new Error("Invalid product.");
  }
  if (
    args.location !== undefined &&
    (typeof args.location !== "string" || args.location.length > 100)
  ) {
    throw new Error("Invalid location.");
  }
  if (
    args.min_quantity !== undefined &&
    (typeof args.min_quantity !== "number" ||
      !Number.isFinite(args.min_quantity) ||
      args.min_quantity < 0)
  ) {
    throw new Error("Invalid minimum quantity.");
  }
  if (
    args.available_on !== undefined &&
    (typeof args.available_on !== "string" ||
      !isValidDate(args.available_on))
  ) {
    throw new Error("Invalid availability date.");
  }

  return {
    product:
      typeof args.product === "string"
        ? args.product.trim() || undefined
        : undefined,
    location:
      typeof args.location === "string"
        ? args.location.trim() || undefined
        : undefined,
    min_quantity: args.min_quantity as number | undefined,
    available_on: args.available_on as string | undefined,
  };
}

export const searchAvailableSellersTool = {
  type: "function" as const,
  name: "search_available_sellers",
  description:
    "Search verified currently available FarmLoop listings. Use for buyer questions about products, sellers, quantities, prices, locations, or availability.",
  parameters: {
    type: "object" as const,
    properties: {
      product: {
        type: "string",
        description:
          "Product name or category, for example maize stalks or manure.",
      },
      location: {
        type: "string",
        description: "Optional location or seller location.",
      },
      min_quantity: {
        type: "number",
        description: "Optional minimum available quantity.",
      },
      available_on: {
        type: "string",
        description: "Optional YYYY-MM-DD availability date.",
      },
    },
  },
};

export async function searchAvailableSellers(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  args: SearchSellerArguments
): Promise<SearchSellerListing[]> {
  await supabase.rpc("sync_expired_listing_statuses");
  const today = getKenyanDate();
  let query = supabase
    .from("seller_listings")
    .select(`
      id,
      seller_id,
      seller_name,
      quantity_available,
      unit,
      price_per_unit,
      location,
      condition,
      available_from,
      available_until,
      status,
      catalogue_products (
        name,
        category,
        description
      )
    `)
    .eq("status", "active")
    .gt("quantity_available", 0)
    .lte("available_from", today)
    .gte("available_until", today)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (args.available_on) {
    query = query
      .lte("available_from", args.available_on)
      .gte("available_until", args.available_on);
  }
  if (args.min_quantity !== undefined) {
    query = query.gte("quantity_available", args.min_quantity);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not search listings: ${error.message}`);

  const listings = (data ?? []) as unknown as SearchSellerListing[];
  const product = args.product?.toLowerCase();
  const location = args.location?.toLowerCase();

  return listings.filter((listing) => {
    const productText =
      [
        listing.catalogue_products?.name,
        listing.catalogue_products?.category,
        listing.catalogue_products?.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    const locationText =
      `${listing.location} ${listing.seller_name}`.toLowerCase();

    return (
      (!product || productText.includes(product)) &&
      (!location || locationText.includes(location))
    );
  });
}

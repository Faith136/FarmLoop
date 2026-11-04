"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
export interface SellerActionResult {
  error?: string;
  success?: string;
}

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createSellerListing(
  formData: FormData,
): Promise<SellerActionResult> {
  const { supabase, user, profile } = await requireRole("seller");
  if (profile.role === "admin") {
    return { error: "Admins can manage existing listings but cannot publish a seller listing from an admin account." };
  }

  const productId = value(formData, "productId");
  const quantity = Number(formData.get("quantity"));
  const price = Number(formData.get("price"));
  const unit = value(formData, "unit");
  const location = value(formData, "location");
  const condition = value(formData, "condition");
  const availableFrom = value(formData, "availableFrom");
  const availableUntil = value(formData, "availableUntil");

  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Select a product and enter a quantity greater than zero." };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid price per unit." };
  }
  if (unit !== "kg" && unit !== "tonne" && unit !== "bag") {
    return { error: "Choose a valid listing unit." };
  }
  if (
    location.length < 2 ||
    location.length > 120 ||
    condition.length < 2 ||
    condition.length > 240
  ) {
    return { error: "Enter a location (2–120 characters) and condition (2–240 characters)." };
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(availableFrom) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(availableUntil) ||
    availableUntil < availableFrom
  ) {
    return { error: "Choose valid availability dates in the correct order." };
  }

  const { data: product, error: productError } = await supabase
    .from("catalogue_products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    return { error: `Could not verify the selected product: ${productError.message}` };
  }
  if (!product) {
    return { error: "That product is no longer in the catalogue." };
  }

  const { error } = await supabase.from("seller_listings").insert({
    seller_id: user.id,
    seller_name: profile.display_name,
    seller_email: user.email ?? "",
    product_id: productId,
    quantity_available: quantity,
    unit,
    price_per_unit: price,
    location,
    condition,
    available_from: availableFrom,
    available_until: availableUntil,
    status: "active",
  });

  if (error) {
    return { error: `Could not publish your listing: ${error.message}` };
  }

  revalidatePath("/seller");
  revalidatePath("/marketplace");
  return { success: "Your listing is now available in the marketplace." };
}

export async function updateSellerListingStatus(
  formData: FormData,
): Promise<SellerActionResult> {
  const { supabase } = await requireRole("seller");
  const listingId = value(formData, "listingId");
  const status = value(formData, "status");

  if (
    !listingId ||
    (status !== "active" && status !== "paused" && status !== "sold_out")
  ) {
    return { error: "Choose a valid listing and status." };
  }

  const { error } = await supabase
    .from("seller_listings")
    .update({ status })
    .eq("id", listingId);

  if (error) {
    return { error: `Could not update the listing: ${error.message}` };
  }

  revalidatePath("/seller");
  revalidatePath("/marketplace");
  return { success: "Listing status updated." };
}

export async function deleteSellerListing(
  formData: FormData,
): Promise<SellerActionResult> {
  const { supabase } = await requireRole("seller");
  const listingId = value(formData, "listingId");

  if (!listingId) {
    return { error: "Choose a listing to remove." };
  }

  const { error } = await supabase
    .from("seller_listings")
    .delete()
    .eq("id", listingId);

  if (error) {
    return { error: `Could not remove the listing: ${error.message}` };
  }

  revalidatePath("/seller");
  revalidatePath("/marketplace");
  return { success: "Listing removed." };
}

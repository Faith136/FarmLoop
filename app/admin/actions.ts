"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import {
  MARKETPLACE_CATEGORIES,
} from "@/lib/domain/marketplace";
import type { ListingStatus } from "@/lib/domain/marketplace";

export interface AdminActionResult {
  error?: string;
  success?: string;
}

type CatalogueProductInput = {
  name: string;
  category: (typeof MARKETPLACE_CATEGORIES)[number];
  description: string;
  icon: string;
};

type ProductValidationResult =
  | { valid: false; error: string }
  | { valid: true; value: CatalogueProductInput };

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function validId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validProduct(formData: FormData): ProductValidationResult {
  const name = field(formData, "name");
  const category = field(formData, "category");
  const description = field(formData, "description");
  const icon = field(formData, "icon") || "🌱";

  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: "Product names must be between 2 and 120 characters." };
  }
  const validCategory = MARKETPLACE_CATEGORIES.find((item) => item === category);
  if (!validCategory) {
    return { valid: false, error: "Choose a valid product category." };
  }
  if (description.length < 5 || description.length > 500) {
    return { valid: false, error: "Descriptions must be between 5 and 500 characters." };
  }
  if (icon.length > 8) {
    return { valid: false, error: "Choose a shorter product icon." };
  }

  return {
    valid: true,
    value: { name, category: validCategory, description, icon },
  };
}

export async function createCatalogueProduct(
  formData: FormData,
): Promise<AdminActionResult> {
  const { supabase } = await requireRole("admin");
  const product = validProduct(formData);

  if (!product.valid) {
    return product;
  }

  const { error } = await supabase.from("catalogue_products").insert(product.value);

  if (error) {
    return { error: `Could not add the product: ${error.message}` };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/catalogue");
  revalidatePath("/seller");
  revalidatePath("/marketplace");
  return { success: "Product added to the shared catalogue." };
}

export async function updateCatalogueProduct(
  formData: FormData,
): Promise<AdminActionResult> {
  const { supabase } = await requireRole("admin");
  const id = field(formData, "id");
  const product = validProduct(formData);

  if (!id) {
    return { error: "Choose a catalogue product to update." };
  }
  if (!product.valid) {
    return product;
  }

  const { error } = await supabase
    .from("catalogue_products")
    .update(product.value)
    .eq("id", id);

  if (error) {
    return { error: `Could not update the product: ${error.message}` };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/catalogue");
  revalidatePath("/seller");
  revalidatePath("/marketplace");
  return { success: "Catalogue product updated." };
}

export async function setCatalogueProductActive(
  formData: FormData,
): Promise<AdminActionResult> {
  const { supabase } = await requireRole("admin");
  const id = field(formData, "id");
  const isActive = field(formData, "isActive");

  if (!id || (isActive !== "true" && isActive !== "false")) {
    return { error: "Choose a catalogue product and a valid visibility setting." };
  }

  const { error } = await supabase
    .from("catalogue_products")
    .update({ is_active: isActive === "true" })
    .eq("id", id);

  if (error) {
    return { error: `Could not update product visibility: ${error.message}` };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/catalogue");
  revalidatePath("/seller");
  revalidatePath("/marketplace");
  return {
    success: isActive === "true"
      ? "Product is available to sellers again."
      : "Product is no longer available for new listings or marketplace browsing.",
  };
}

export async function setAccountSuspended(
  formData: FormData,
): Promise<AdminActionResult> {
  const { supabase } = await requireRole("admin");
  const id = field(formData, "id");
  const suspended = field(formData, "suspended");

  if (!validId(id) || (suspended !== "true" && suspended !== "false")) {
    return { error: "Choose an account and a valid account status." };
  }

  const isSuspended = suspended === "true";
  const { error } = await supabase.rpc("admin_set_account_suspended", {
    target_user_id: id,
    suspend_account: isSuspended,
  });

  if (error) {
    return { error: `Could not update the account status: ${error.message}` };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return {
    success: isSuspended
      ? "Account suspended. The user can no longer access their workspace or manage listings."
      : "Account reactivated.",
  };
}

export async function setSellerListingStatus(
  formData: FormData,
): Promise<AdminActionResult> {
  const { supabase } = await requireRole("admin");
  const id = field(formData, "id");
  const status = field(formData, "status");
  const validStatus: ListingStatus | undefined =
    status === "active" || status === "paused" || status === "sold_out"
      ? status
      : undefined;

  if (!validId(id) || !validStatus) {
    return { error: "Choose a listing and a valid listing status." };
  }

  const { error } = await supabase
    .from("seller_listings")
    .update({ status: validStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `Could not update the listing: ${error.message}` };
  }

  revalidatePath("/admin/listings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/marketplace");
  revalidatePath("/seller");
  return { success: "Listing status updated." };
}

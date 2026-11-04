import type {
  ListingStatus,
  ListingUnit,
  MarketplaceCategory,
} from "@/lib/domain/marketplace";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type UserRole = "buyer" | "seller" | "admin";

export type Profile = {
  id: string;
  display_name: string;
  email: string | null;
  role: UserRole;
  is_suspended: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type AccountActivityRow = {
  id: string;
  profile_id: string;
  actor_id: string | null;
  event_type: "account_created" | "signed_in" | "suspended" | "reactivated";
  occurred_at: string;
};

export type AdminActionLogRow = {
  id: string;
  actor_id: string;
  action: string;
  target_type: "account" | "listing" | "catalogue";
  target_id: string | null;
  occurred_at: string;
};

export type CatalogueProductRow = {
  id: string;
  name: string;
  category: MarketplaceCategory;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
};

export type SellerListingRow = {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  product_id: string;
  quantity_available: number;
  unit: ListingUnit;
  price_per_unit: number;
  location: string;
  condition: string;
  available_from: string;
  available_until: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        Pick<Profile, "id" | "display_name" | "role">,
        Partial<Pick<Profile, "display_name" | "last_login_at" | "role">>
      >;
      account_activity: Table<
        AccountActivityRow,
        Pick<AccountActivityRow, "profile_id" | "event_type">,
        never
      >;
      admin_action_log: Table<
        AdminActionLogRow,
        Pick<AdminActionLogRow, "actor_id" | "action" | "target_type">,
        never
      >;
      catalogue_products: Table<
        CatalogueProductRow,
        Pick<CatalogueProductRow, "name" | "category" | "description" | "icon">,
        Partial<Pick<CatalogueProductRow, "name" | "category" | "description" | "icon" | "is_active">>
      >;
      seller_listings: Table<
        SellerListingRow,
        Omit<SellerListingRow, "id" | "created_at" | "updated_at">,
        Partial<Omit<SellerListingRow, "id" | "seller_id" | "created_at">>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      admin_set_account_suspended: {
        Args: { target_user_id: string; suspend_account: boolean };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

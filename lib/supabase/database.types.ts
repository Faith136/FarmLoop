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

export type OrderStatus =
  | "pending"
  | "countered"
  | "accepted"
  | "rejected"
  | "ready_for_collection"
  | "completed";

export type OrderRow = {
  id: string;
  listing_id: string | null;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  seller_name: string;
  product_name: string;
  unit: ListingUnit;
  requested_quantity: number;
  unit_price: number;
  estimated_total: number;
  buyer_message: string | null;
  seller_message: string | null;
  status: OrderStatus;
  proposed_quantity: number | null;
  proposed_unit_price: number | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationRow = {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  order_id: string | null;
  conversation_id: string | null;
  notification_type:
    | "order_request"
    | "order_accepted"
    | "order_rejected"
    | "order_countered"
    | "order_ready"
    | "order_completed"
    | "new_message";
  title: string;
  body: string;
  href: string;
  created_at: string;
  read_at: string | null;
};

export type OrderTimelineRow = {
  id: string;
  order_id: string;
  actor_id: string | null;
  event_type: string;
  note: string;
  occurred_at: string;
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
      orders: Table<
        OrderRow,
        never,
        never
      >;
      conversations: Table<
        ConversationRow,
        never,
        never
      >;
      messages: Table<
        MessageRow,
        Pick<MessageRow, "conversation_id" | "sender_id" | "body">,
        never
      >;
      notifications: Table<
        NotificationRow,
        never,
        Pick<NotificationRow, "read_at">
      >;
      order_timeline: Table<
        OrderTimelineRow,
        never,
        never
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
      create_order_request: {
        Args: { p_listing_id: string; p_quantity: number; p_message?: string | null };
        Returns: string;
      };
      accept_order_request: {
        Args: { p_order_id: string };
        Returns: string;
      };
      reject_order_request: {
        Args: { p_order_id: string; p_explanation?: string | null };
        Returns: string;
      };
      propose_order_change: {
        Args: {
          p_order_id: string;
          p_quantity: number;
          p_unit_price: number;
          p_message?: string | null;
        };
        Returns: string;
      };
      respond_to_order_proposal: {
        Args: { p_order_id: string; p_accept: boolean };
        Returns: string;
      };
      set_order_fulfillment_status: {
        Args: { p_order_id: string; p_status: string };
        Returns: string;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

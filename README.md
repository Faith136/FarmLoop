# FarmLoop

FarmLoop connects agricultural by-products with buyers. It is built with Next.js, TypeScript, Supabase Auth, and PostgreSQL.

## Set up Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set your project URL, publishable key, and site URL. Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable.
3. Run the SQL files in `supabase/migrations` in timestamp order in the Supabase SQL Editor, or apply them with the Supabase CLI. The profile backfill migration creates profiles for accounts that existed before the profile trigger was installed.
4. In Supabase Authentication settings, enable email/password sign-in and add `http://localhost:3000/auth/callback` and your deployed `/auth/callback` URL to the allowed redirect URLs.
5. Start the app with `npm run dev`.

Without Supabase environment variables, the public marketplace continues to show its local sample listings. Authentication, order requests, messaging, and role-based workspaces require the Supabase project and migrations.

## Account roles

- **Buyer:** create order requests from marketplace listings and track seller responses in the buyer workspace.
- **Seller:** create listings drawn from the shared catalogue, manage incoming order requests, and coordinate accepted orders privately.
- **Admin:** sign in at `/admin/login` using an account provisioned through a trusted database operation. Public registration intentionally does not offer administrator privileges.

To provision an administrator, create the Auth user through the Supabase Dashboard (Authentication → Users), confirm its email, and then run this statement in the Supabase SQL Editor, replacing the email address. Do not use the public signup form to provision administrator accounts:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@example.com'
);
```

The database creates profiles on signup and enforces row-level security for profiles, seller listings, the admin-managed catalogue, orders, conversations, messages, and notifications. Public users cannot grant themselves an administrator role.

Admin pages are available at `/admin/dashboard`, `/admin/catalogue`, `/admin/users`, `/admin/listings`, and `/admin/orders`. Admins can view buyer/seller account details and activity, suspend or reactivate those accounts, moderate individual listings separately, and inspect read-only confirmed order and transaction reports. Suspending a seller hides their active listings without changing each listing's moderation status. Administrator actions and account status changes are recorded in the admin history.

Run `20261104000000_admin_account_management.sql` after the initial schema to add account status fields, activity and audit logs, suspension enforcement, and admin-only account operations. Then run `20261108000000_orders_messaging_notifications.sql` to add order requests, order timelines, stock reservation RPCs, private order conversations, message and notification tables, participant-only RLS, and Realtime publication for messages and notifications. Finally run `20261108010000_admin_transaction_reporting.sql` to add confirmation timestamps and grant admins read-only RLS access to transaction records and status history.

Order requests do not reserve or deduct stock until a seller accepts (or a buyer accepts the seller’s counterproposal). The database locks the listing during acceptance so concurrent requests cannot reserve more than the available quantity. Accepted orders open a private buyer-seller conversation; contact details are not shared by the marketplace.

## Development

```bash
npm run lint
npx tsc --noEmit
npm run build
```

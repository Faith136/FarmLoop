# FarmLoop

FarmLoop connects agricultural by-products with buyers. It is built with Next.js, TypeScript, Supabase Auth, and PostgreSQL.

## Set up Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set your project URL, publishable key, and site URL. Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable.
3. Run the SQL files in `supabase/migrations` in timestamp order in the Supabase SQL Editor, or apply them with the Supabase CLI. The profile backfill migration creates profiles for accounts that existed before the profile trigger was installed.
4. In Supabase Authentication settings, enable email/password sign-in and add `http://localhost:3000/auth/callback` and your deployed `/auth/callback` URL to the allowed redirect URLs.
5. Start the app with `npm run dev`.

Without Supabase environment variables, the public marketplace continues to show its local sample listings. Authentication and the seller/admin dashboards require the Supabase project and migration.

## Account roles

- **Buyer:** create an account to continue to the marketplace.
- **Seller:** create an account to manage listings drawn from the shared catalogue. Published listings appear in the marketplace.
- **Admin:** sign in at `/admin/login` using an account provisioned through a trusted database operation. Public registration intentionally does not offer administrator privileges.

To provision an administrator, create the Auth user through the Supabase Dashboard (Authentication → Users), confirm its email, and then run this statement in the Supabase SQL Editor, replacing the email address. Do not use the public signup form to provision administrator accounts:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@example.com'
);
```

The database creates profiles on signup and enforces row-level security for profiles, seller listings, and the admin-managed catalogue. Public users cannot grant themselves an administrator role.

Admin pages are available at `/admin/dashboard`, `/admin/catalogue`, `/admin/users`, and `/admin/listings`. The dashboard uses the existing profile, catalogue, and seller-listing tables. Admins can view buyer/seller account details and activity, suspend or reactivate those accounts, and moderate individual listings separately. Suspending a seller hides their active listings without changing each listing's moderation status. Administrator actions and account status changes are recorded in the admin history.

The current marketplace has no checkout flow or orders table, so buyer order history is not available yet. Seller verification and advanced moderation are also not part of this release.

Run the new `20261104000000_admin_account_management.sql` migration after the existing migrations to add account email/status fields, activity and audit logs, suspension enforcement, and admin-only account operations.

## Development

```bash
npm run lint
npx tsc --noEmit
npm run build
```

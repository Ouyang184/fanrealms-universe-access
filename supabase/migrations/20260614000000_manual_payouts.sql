-- Manual (non-Stripe) payouts: lets creators who cannot use Stripe (e.g. RPG
-- Maker plugin devs, international creators) record a payout method, and lets
-- the platform owner pay them by hand and mark earnings paid.
--
-- Applied to the live project via MCP on 2026-06-14; kept here so repo history
-- matches the database. All statements are idempotent.

-- 1. Payout fields on creators.
--    NOTE: no SELECT grant is given to anon/authenticated, so these are NOT
--    publicly readable even though RLS allows reading creator rows. The owner
--    reads their own via get_my_payout_info(); admin reads via the admin RPC.
alter table public.creators
  add column if not exists payout_method text,
  add column if not exists payout_details text;

-- Allow a creator to WRITE their own payout fields (RLS already restricts the
-- row to auth.uid() = user_id). Mirrors how platform_fee_rate is updated.
grant update (payout_method, payout_details) on public.creators to authenticated;

-- 2. Creator reads their own payout info (column has no SELECT grant).
create or replace function public.get_my_payout_info()
returns table (payout_method text, payout_details text)
language sql
security definer
set search_path = public
as $$
  select payout_method, payout_details
  from public.creators
  where user_id = auth.uid()
  limit 1;
$$;
grant execute on function public.get_my_payout_info() to authenticated;

-- 3. Admin: list everyone owed a manual payout (pending earnings, no Stripe).
--    Stripe-connected creators record earnings as 'transferred', so 'pending'
--    rows are exactly the manual-payout queue.
create or replace function public.admin_list_pending_payouts()
returns table (
  creator_id uuid,
  display_name text,
  username text,
  payout_method text,
  payout_details text,
  pending_total numeric,
  pending_count bigint,
  oldest_pending timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.users where id = auth.uid() and is_admin = true) then
    raise exception 'not authorized';
  end if;

  return query
  select c.id,
         c.display_name,
         c.username,
         c.payout_method,
         c.payout_details,
         coalesce(sum(e.net_amount), 0)::numeric,
         count(e.id)::bigint,
         min(e.created_at)
  from public.creator_earnings e
  join public.creators c on c.id = e.creator_id
  left join public.creator_stripe_accounts sa on sa.creator_id = c.id
  where e.status = 'pending'
    and coalesce(sa.stripe_charges_enabled, false) = false
  group by c.id, c.display_name, c.username, c.payout_method, c.payout_details
  having coalesce(sum(e.net_amount), 0) > 0
  order by min(e.created_at) asc;
end;
$$;
grant execute on function public.admin_list_pending_payouts() to authenticated;

-- 4. Admin: mark a creator's pending earnings as paid (after sending money).
create or replace function public.admin_mark_payouts_paid(p_creator_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not exists (select 1 from public.users where id = auth.uid() and is_admin = true) then
    raise exception 'not authorized';
  end if;

  update public.creator_earnings
    set status = 'paid', payment_date = now()
    where creator_id = p_creator_id and status = 'pending';
  get diagnostics n = row_count;
  return n;
end;
$$;
grant execute on function public.admin_mark_payouts_paid(uuid) to authenticated;

insert into public.profiles (id, display_name, role)
select
  users.id,
  coalesce(
    case
      when char_length(trim(users.raw_user_meta_data ->> 'display_name')) between 2 and 100
        then trim(users.raw_user_meta_data ->> 'display_name')
    end,
    case
      when char_length(split_part(coalesce(users.email, ''), '@', 1)) between 2 and 100
        then split_part(users.email, '@', 1)
    end,
    'FarmLoop member'
  ),
  'buyer'
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;

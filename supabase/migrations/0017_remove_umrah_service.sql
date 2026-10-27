-- Umrah packages are not offered; keep only holy/spiritual tour planning.
delete from public.services where slug = 'umrah-guidance' and is_active = false;

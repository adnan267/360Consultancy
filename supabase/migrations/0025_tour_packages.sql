-- Tour packages and religious tour packages, managed from Admin -> Packages. Price is hidden unless show_price is on.
create table if not exists public.tour_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null check (category in ('tour','religious')),
  section text check (section is null or section in ('umrah','hajj','makkah-madinah-ziyarat','iraq-ziyarat','iran-ziyarat','jerusalem-al-aqsa','other-religious')),
  title text not null,
  flag text,
  country_slug text,
  summary text not null default '',
  highlights text[] not null default '{}',
  inclusions text[] not null default '{}',
  duration_days int check (duration_days is null or duration_days between 1 and 90),
  price_pkr int check (price_pkr is null or price_pkr >= 0),
  price_note text not null default 'per person',
  show_price boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tour_packages_cat_idx on public.tour_packages (category, section, sort_order);
alter table public.tour_packages enable row level security;
insert into public.tour_packages (slug,category,section,title,flag,country_slug,summary,highlights,inclusions,duration_days,price_pkr,price_note,show_price,is_published,sort_order) values
('dubai-and-uae-tour','tour',null,'Dubai & UAE','ae','united-arab-emirates','City breaks, family holidays and shopping',array['Burj Khalifa and Dubai Mall','Desert safari','Abu Dhabi: Sheikh Zayed Grand Mosque']::text[],array[]::text[],null,null,'per person',false,true,1),
('turkiye-tour','tour',null,'Türkiye','tr','turkey','History, culture and scenery',array['Istanbul: Hagia Sophia and the Bosphorus','Cappadocia','Pamukkale']::text[],array[]::text[],null,null,'per person',false,true,2),
('malaysia-tour','tour',null,'Malaysia','my','malaysia','Families, honeymoons and first international trip',array['Kuala Lumpur: Petronas Towers','Langkawi','Genting Highlands']::text[],array[]::text[],null,null,'per person',false,true,3),
('thailand-tour','tour',null,'Thailand','th','thailand','Beaches, islands and city life',array['Bangkok','Phuket and Krabi','Pattaya']::text[],array[]::text[],null,null,'per person',false,true,4),
('azerbaijan-tour','tour',null,'Azerbaijan','az','azerbaijan','Short, affordable-feeling city and mountain trips',array['Baku Old City and Flame Towers','Gabala','Gobustan']::text[],array[]::text[],null,null,'per person',false,true,5),
('georgia-tour','tour',null,'Georgia','ge','georgia','Mountains, old towns and wine country',array['Tbilisi','Kazbegi','Batumi on the Black Sea']::text[],array[]::text[],null,null,'per person',false,true,6),
('maldives-tour','tour',null,'Maldives','mv','maldives','Honeymoons and island resorts',array['Resort islands','Snorkelling and diving','Sunset cruises']::text[],array[]::text[],null,null,'per person',false,true,7),
('sri-lanka-tour','tour',null,'Sri Lanka','lk','sri-lanka','Nature, tea country and beaches',array['Kandy and Nuwara Eliya','Sigiriya','Southern beaches']::text[],array[]::text[],null,null,'per person',false,true,8),
('nepal-tour','tour',null,'Nepal','np','nepal','Mountains, culture and adventure',array['Kathmandu valley','Pokhara','Himalayan views']::text[],array[]::text[],null,null,'per person',false,true,9)
on conflict (slug) do nothing;

update public.services set title = 'Religious & Spiritual Tour Planning' where slug = 'spiritual-tour-guidance';

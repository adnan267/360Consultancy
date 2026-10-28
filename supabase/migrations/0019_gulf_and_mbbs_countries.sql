-- Saudi Arabia plus MBBS-study destinations (Russia, Kyrgyzstan, Uzbekistan). Guidance pages with official links only.
insert into public.countries (slug,name,iso_code,is_active,sort_order) values
('saudi-arabia','Saudi Arabia','SA',true,34),
('russia','Russia','RU',true,35),
('kyrgyzstan','Kyrgyzstan','KG',true,36),
('uzbekistan','Uzbekistan','UZ',true,37)
on conflict (slug) do nothing;

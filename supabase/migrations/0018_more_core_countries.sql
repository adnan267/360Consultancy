-- Additional study/work/visit destinations (guidance pages with official links only; no unverified rules).
insert into public.countries (slug,name,iso_code,is_active,sort_order) values
('germany','Germany','DE',true,8),
('france','France','FR',true,9),
('italy','Italy','IT',true,10),
('spain','Spain','ES',true,11),
('ireland','Ireland','IE',true,12),
('netherlands','Netherlands','NL',true,13),
('sweden','Sweden','SE',true,14),
('norway','Norway','NO',true,15),
('denmark','Denmark','DK',true,16),
('finland','Finland','FI',true,17),
('poland','Poland','PL',true,18),
('new-zealand','New Zealand','NZ',true,19),
('japan','Japan','JP',true,20),
('south-korea','South Korea','KR',true,21)
on conflict (slug) do nothing;

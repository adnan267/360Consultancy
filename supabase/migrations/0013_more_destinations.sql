-- More destinations (e-visa and visa-free / ETA directory) plus two services for Umrah and spiritual tours.
insert into public.countries (slug,name,iso_code,is_active,sort_order) values
('turkey','Türkiye','TR',true,20),
('united-arab-emirates','United Arab Emirates','AE',true,21),
('malaysia','Malaysia','MY',true,22),
('thailand','Thailand','TH',true,23),
('azerbaijan','Azerbaijan','AZ',true,24),
('vietnam','Vietnam','VN',true,25),
('indonesia','Indonesia','ID',true,26),
('georgia','Georgia','GE',true,27),
('oman','Oman','OM',true,28),
('maldives','Maldives','MV',true,29),
('nepal','Nepal','NP',true,30),
('sri-lanka','Sri Lanka','LK',true,31),
('kenya','Kenya','KE',true,32),
('seychelles','Seychelles','SC',true,33)
on conflict (slug) do nothing;

-- Inserted INACTIVE with no fee: the owner sets real packages/fees and activates them in Admin -> Services & pricing.
insert into public.services (slug,title,summary,description,scope,inclusions,exclusions,duration_minutes,fee_pkr,fee_is_starting_price,fee_needs_review,is_active,refund_terms,sort_order) values
('umrah-guidance','Umrah Planning & Guidance','Help planning your Umrah: documents, timing and arranging an approved package.','Guidance on the steps and documents for Umrah and on choosing an approved, licensed package. Fee and package partners to be confirmed before this service opens.','Planning guidance only. Fee, licensed operator partners and package details to be confirmed before this service opens.',array['Overview of the usual Umrah steps and documents','Help comparing licensed package options','Official links and checklists'],array['Hotel, flight or transport bookings unless a package is separately confirmed','Any guarantee of visa approval or travel dates'],30,0,false,true,false,'Refund and cancellation conditions are set out in the Refund and Cancellation Policy (draft - pending owner approval).',6),
('spiritual-tour-guidance','Holy & Spiritual Tour Planning','Planning support for religious and spiritual journeys.','Guidance on documents, timing and official requirements for religious and spiritual travel. Fee and partners to be confirmed before this service opens.','Planning guidance only. Fee and partners to be confirmed before this service opens.',array['Overview of documents and official requirements','Help comparing tour options from licensed operators','Official links and checklists'],array['Tickets, hotels or tour operation unless separately confirmed','Any guarantee of visa approval'],30,0,false,true,false,'Refund and cancellation conditions are set out in the Refund and Cancellation Policy (draft - pending owner approval).',7)
on conflict (slug) do nothing;

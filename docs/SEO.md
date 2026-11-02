# SEO plan — 360consultancy.pk

## Done in code (technical + on-page)
- One canonical URL per page (no global "/" canonical); private pages (portal, booking confirmation, landing pages `/lp/*`, admin) are `noindex`.
- `robots.txt` blocks admin, API, portal, booking and `/lp/`; sitemap lists all public pages, 24 study destinations, 45 universities, 19+ scholarships, religious-tour pages, countries and blog posts (with lastModified).
- JSON-LD: Organization/ProfessionalService + WebSite (home), BreadcrumbList on destination, university, scholarship and religious-tour pages, CollegeOrUniversity on university pages, FAQ and Article where they already existed.
- Default share card (`opengraph-image`), `en_PK` locale, large image previews allowed.
- Short unique titles (about 50–60 characters) and descriptions on all study pages; one H1 per page.
- Search Console / Bing verification: set `NEXT_PUBLIC_GSC_VERIFICATION` and `NEXT_PUBLIC_BING_VERIFICATION` in Vercel, then redeploy.

## You do (one-time, 1–2 hours)
1. Google Search Console → add `https://360consultancy.pk` (domain property) → submit `https://360consultancy.pk/sitemap.xml`. Repeat in Bing Webmaster Tools (can import from GSC).
2. Google Business Profile: category "Visa consultant" / "Educational consultant", phone +92 339 0394041, hours, service area, photos, then ask real clients for reviews. Keep Name/Address/Phone identical everywhere.
3. Add real social profile links in Vercel env (`NEXT_PUBLIC_SOCIAL_*`) so they appear in the schema `sameAs`.
4. After a week, check Search Console → Pages (indexing errors) and Core Web Vitals.

## Off-page (ongoing)
- Directories and citations (real, relevant): Google Business Profile, Bing Places, Facebook/Instagram/LinkedIn/YouTube pages, Pakistani business directories, education directories.
- Backlinks that are earned, not bought: guest posts and quotes for Pakistani education/travel blogs; scholarship-alert pages shared with student groups and university societies; partner links from tour/hotel partners; local press. Avoid paid link packages and link farms — they can get the site penalised.
- Social proof: client testimonials with permission (never invented), short Reels/Shorts answering one question each (for example "Is a Schengen visit visa possible with a 6-month passport?"), WhatsApp channel for scholarship alerts.
- Sharing: every blog/scholarship page has a share-ready title and card.

## Content calendar (what ranks for Pakistani searchers)
Write one page or post per week, always from official sources, with the source linked and a "last checked" date:
- "Study in {country} for Pakistani students" (cost, requirements, scholarships) for each destination.
- "{Scholarship} for Pakistani students: eligibility, deadline, how to apply" (CSC, Chevening, DAAD, MEXT, Stipendium Hungaricum, Türkiye Burslari, Fulbright, Commonwealth).
- Visa-free / e-visa lists for Pakistani passport holders, updated monthly.
- Umrah/Hajj preparation checklists, Ziyarat guides.
- Document guides: bank statement, SOP, cover letter, travel itinerary.
Internal links: link each new post to its destination page, the scholarship page and the free assessment.

## Rules
Never publish unverified claims ("100% visa", "guaranteed scholarship", fake reviews). Google and Meta both penalise this, and it breaks the site's honesty promise.

import type { Scholarship, StudyDestination, University } from "../lib/types";

/**
 * Study-abroad seed data.
 *
 * RULE: only what an official source states is filled in. Anything we have not
 * confirmed is left blank, and the public pages then say "check the official
 * site". Everything here is editable from Admin -> Study Abroad.
 * `last_verified` is set only for records whose official page was opened and read.
 * Official links for destinations/universities/scholarships we did not open are the
 * well-known official portals; they are listed so students can check for themselves.
 */

const D = (slug: string, name: string, flag: string, region: StudyDestination["region"], links: [string, string][], sort: number): StudyDestination => ({
  slug, name, flag, region,
  overview: "", degree_programs: "", tuition_info: "", living_cost: "", language_requirements: "", english_tests: "",
  admission_requirements: "", visa_requirements: "", work_options: "",
  official_links: links.map(([label, url]) => ({ label, url })),
  last_verified: null, is_published: true, sort_order: sort,
});
const A = "Asia & Middle East" as const, E = "Europe" as const, N = "North America" as const, O = "Oceania" as const;

export const STUDY_DESTINATIONS_SEED: StudyDestination[] = [
  D("china", "China", "cn", A, [["Study in China / Chinese Government Scholarship portal", "https://www.campuschina.org/"]], 1),
  D("turkey", "Türkiye", "tr", A, [["Study in Türkiye", "https://www.studyinturkiye.gov.tr/"], ["Türkiye Scholarships", "https://turkiyeburslari.gov.tr/"]], 2),
  D("saudi-arabia", "Saudi Arabia", "sa", A, [["Study in Saudi Arabia (Ministry of Education)", "https://studyinsaudi.moe.gov.sa/"]], 3),
  D("japan", "Japan", "jp", A, [["Study in Japan (official)", "https://www.studyinjapan.go.jp/en/"]], 4),
  D("south-korea", "South Korea", "kr", A, [["Study in Korea (official)", "https://www.studyinkorea.go.kr/"]], 5),
  D("taiwan", "Taiwan", "tw", A, [["Study in Taiwan (official)", "https://www.studyintaiwan.org/"]], 6),
  D("malaysia", "Malaysia", "my", A, [["EducationMalaysia (official)", "https://educationmalaysia.gov.my/"]], 7),
  D("qatar", "Qatar", "qa", A, [["Qatar University", "https://www.qu.edu.qa/"]], 8),
  D("azerbaijan", "Azerbaijan", "az", A, [["Ministry of Science and Education", "https://edu.gov.az/en"]], 9),
  D("russia", "Russia", "ru", A, [["Education in Russia (official)", "https://education-in-russia.com/"]], 10),
  D("germany", "Germany", "de", E, [["Study in Germany (DAAD)", "https://www.study-in-germany.de/"], ["DAAD Pakistan", "https://www.daad.pk/"]], 11),
  D("hungary", "Hungary", "hu", E, [["Study in Hungary", "https://studyinhungary.hu/"], ["Stipendium Hungaricum", "https://stipendiumhungaricum.hu/"]], 12),
  D("italy", "Italy", "it", E, [["Universitaly (Ministry of University and Research)", "https://www.universitaly.it/"]], 13),
  D("france", "France", "fr", E, [["Campus France", "https://www.campusfrance.org/en"]], 14),
  D("united-kingdom", "United Kingdom", "gb", E, [["UK student visa (GOV.UK)", "https://www.gov.uk/student-visa"], ["British Council Pakistan", "https://www.britishcouncil.pk/"]], 15),
  D("romania", "Romania", "ro", E, [["Study in Romania", "https://www.studyinromania.gov.ro/"]], 16),
  D("poland", "Poland", "pl", E, [["Study in Poland", "https://study.gov.pl/"]], 17),
  D("spain", "Spain", "es", E, [["Ministry of Education (Spain)", "https://www.educacionyfp.gob.es/"]], 18),
  D("finland", "Finland", "fi", E, [["Study in Finland", "https://www.studyinfinland.fi/"], ["Finnish Immigration Service", "https://migri.fi/en"]], 19),
  D("sweden", "Sweden", "se", E, [["Study in Sweden", "https://studyinsweden.se/"], ["Swedish Migration Agency", "https://www.migrationsverket.se/en"]], 20),
  D("netherlands", "Netherlands", "nl", E, [["Study in NL", "https://www.studyinnl.org/"], ["IND (immigration)", "https://ind.nl/en"]], 21),
  D("united-states", "USA", "us", N, [["EducationUSA (U.S. Department of State)", "https://educationusa.state.gov/"], ["U.S. visas", "https://travel.state.gov/"]], 22),
  D("canada", "Canada", "ca", N, [["EduCanada (official)", "https://www.educanada.ca/"]], 23),
  D("australia", "Australia", "au", O, [["Study Australia (official)", "https://www.studyaustralia.gov.au/"], ["Home Affairs (visas)", "https://immi.homeaffairs.gov.au/"]], 24),
];

const U = (slug: string, name: string, country: string, city: string, url: string, sort: number): University => ({
  slug, name, country_slug: country, city, logo_url: null,
  overview: "", official_url: url, ranking: "", ranking_source: "", ranking_year: null,
  degree_levels: [], programs: [], tuition_range: "", admission_requirements: "", english_requirements: "",
  scholarships_note: "", scholarship_coverage: "", tuition_free_note: "", apply_opens: "", apply_closes: "",
  admission_portal_url: null, last_verified: null, is_published: true, sort_order: sort,
});

export const UNIVERSITIES_SEED: University[] = [
  U("tsinghua-university", "Tsinghua University", "china", "Beijing", "https://www.tsinghua.edu.cn/en/", 1),
  U("peking-university", "Peking University", "china", "Beijing", "https://english.pku.edu.cn/", 2),
  U("zhejiang-university", "Zhejiang University", "china", "Hangzhou", "https://www.zju.edu.cn/english/", 3),
  U("fudan-university", "Fudan University", "china", "Shanghai", "https://www.fudan.edu.cn/en/", 4),
  U("istanbul-university", "Istanbul University", "turkey", "Istanbul", "https://www.istanbul.edu.tr/en", 5),
  U("ankara-university", "Ankara University", "turkey", "Ankara", "https://en.ankara.edu.tr/", 6),
  U("hacettepe-university", "Hacettepe University", "turkey", "Ankara", "https://www.hacettepe.edu.tr/english", 7),
  U("middle-east-technical-university", "Middle East Technical University", "turkey", "Ankara", "https://www.metu.edu.tr/", 8),
  U("king-abdulaziz-university", "King Abdulaziz University", "saudi-arabia", "Jeddah", "https://www.kau.edu.sa/", 9),
  U("king-saud-university", "King Saud University", "saudi-arabia", "Riyadh", "https://ksu.edu.sa/en", 10),
  U("islamic-university-of-madinah", "Islamic University of Madinah", "saudi-arabia", "Madinah", "https://iu.edu.sa/", 11),
  U("kfupm", "King Fahd University of Petroleum & Minerals", "saudi-arabia", "Dhahran", "https://www.kfupm.edu.sa/", 12),
  U("jouf-university", "Jouf University", "saudi-arabia", "Sakaka", "https://www.ju.edu.sa/", 13),
  U("university-of-debrecen", "University of Debrecen", "hungary", "Debrecen", "https://unideb.hu/en", 14),
  U("eotvos-lorand-university", "Eötvös Loránd University (ELTE)", "hungary", "Budapest", "https://www.elte.hu/en/", 15),
  U("university-of-szeged", "University of Szeged", "hungary", "Szeged", "https://u-szeged.hu/english", 16),
  U("budapest-university-of-technology", "Budapest University of Technology and Economics (BME)", "hungary", "Budapest", "https://www.bme.hu/?language=en", 17),
  U("technical-university-of-munich", "Technical University of Munich", "germany", "Munich", "https://www.tum.de/en/", 18),
  U("heidelberg-university", "Heidelberg University", "germany", "Heidelberg", "https://www.uni-heidelberg.de/en", 19),
  U("university-of-bonn", "University of Bonn", "germany", "Bonn", "https://www.uni-bonn.de/en", 20),
  U("rwth-aachen-university", "RWTH Aachen University", "germany", "Aachen", "https://www.rwth-aachen.de/go/id/a/?lidx=1", 21),
  U("university-of-tokyo", "University of Tokyo", "japan", "Tokyo", "https://www.u-tokyo.ac.jp/en/", 22),
  U("kyoto-university", "Kyoto University", "japan", "Kyoto", "https://www.kyoto-u.ac.jp/en", 23),
  U("osaka-university", "Osaka University", "japan", "Suita, Osaka", "https://www.osaka-u.ac.jp/en", 24),
  U("tohoku-university", "Tohoku University", "japan", "Sendai", "https://www.tohoku.ac.jp/en/", 25),
  U("seoul-national-university", "Seoul National University", "south-korea", "Seoul", "https://en.snu.ac.kr/", 26),
  U("kaist", "KAIST", "south-korea", "Daejeon", "https://www.kaist.ac.kr/en/", 27),
  U("korea-university", "Korea University", "south-korea", "Seoul", "https://www.korea.edu/", 28),
  U("yonsei-university", "Yonsei University", "south-korea", "Seoul", "https://www.yonsei.ac.kr/en_sc/", 29),
  U("university-of-bologna", "University of Bologna", "italy", "Bologna", "https://www.unibo.it/en", 30),
  U("university-of-padua", "University of Padua", "italy", "Padua", "https://www.unipd.it/en/", 31),
  U("university-of-milan", "University of Milan", "italy", "Milan", "https://www.unimi.it/en", 32),
  U("politecnico-di-milano", "Politecnico di Milano", "italy", "Milan", "https://www.polimi.it/en", 33),
  U("university-of-oxford", "University of Oxford", "united-kingdom", "Oxford", "https://www.ox.ac.uk/", 34),
  U("university-of-cambridge", "University of Cambridge", "united-kingdom", "Cambridge", "https://www.cam.ac.uk/", 35),
  U("university-of-manchester", "University of Manchester", "united-kingdom", "Manchester", "https://www.manchester.ac.uk/", 36),
  U("university-of-edinburgh", "University of Edinburgh", "united-kingdom", "Edinburgh", "https://www.ed.ac.uk/", 37),
  U("harvard-university", "Harvard University", "united-states", "Cambridge, Massachusetts", "https://www.harvard.edu/", 38),
  U("yale-university", "Yale University", "united-states", "New Haven, Connecticut", "https://www.yale.edu/", 39),
  U("mit", "Massachusetts Institute of Technology (MIT)", "united-states", "Cambridge, Massachusetts", "https://www.mit.edu/", 40),
  U("stanford-university", "Stanford University", "united-states", "Stanford, California", "https://www.stanford.edu/", 41),
  U("universite-paris-saclay", "Université Paris-Saclay", "france", "Paris-Saclay area", "https://www.universite-paris-saclay.fr/en", 42),
  U("sorbonne-university", "Sorbonne University", "france", "Paris", "https://www.sorbonne-universite.fr/en", 43),
  U("university-of-bucharest", "University of Bucharest", "romania", "Bucharest", "https://unibuc.ro/?lang=en", 44),
  U("politehnica-university-of-bucharest", "Politehnica University of Bucharest", "romania", "Bucharest", "https://upb.ro/en/", 45),
];

const NOT_CONFIRMED = "Details for this scholarship are not yet confirmed from the official source on this site. Open the official site for the current call, eligibility and dates.";
const S = (slug: string, name: string, country: string, provider: string, url: string, sort: number, extra: Partial<Scholarship> = {}): Scholarship => ({
  id: `seed-${slug}`, slug, name, country_slug: country, provider,
  degree_levels: [], funding_type: "not_stated", funding_details: "Not confirmed on this site. Check the official source.",
  deadline: null, deadline_note: "Check the official site for the current call and dates.", eligibility_summary: NOT_CONFIRMED,
  official_url: url, last_verified: null, is_published: true,
  eligible_nationalities: "", disciplines: "", tuition_coverage: "", stipend: "", accommodation: "", airfare: "", insurance: "",
  min_qualification: "", age_requirement: "", language_requirement: "", required_documents: [], opens_note: "", duration: "", sort_order: sort,
  ...extra,
});

export const STUDY_SCHOLARSHIPS_SEED: Scholarship[] = [
  S("chinese-government-scholarship-csc", "Chinese Government Scholarship (CSC)", "china", "China Scholarship Council (CSC)", "https://www.campuschina.org/", 1),
  S("turkiye-burslari", "Türkiye Burslari (Türkiye Scholarships)", "turkey", "Presidency for Turks Abroad and Related Communities (YTB), Türkiye", "https://turkiyeburslari.gov.tr/", 2, {
    degree_levels: ["bachelor", "master", "doctoral", "research"],
    funding_type: "full",
    funding_details: "An archived official booklet lists: tuition fee, monthly stipend, accommodation, health insurance, a one-off return flight ticket and a one-year Turkish language course. Amounts in that booklet are old and are not repeated here; see the current call.",
    tuition_coverage: "Tuition fee covered (per the archived official booklet).",
    stipend: "A monthly stipend is listed in the archived booklet. Amounts change; see the current call.",
    accommodation: "Accommodation listed as a benefit (archived booklet).",
    airfare: "One-off return flight ticket listed as a benefit (archived booklet).",
    insurance: "Health insurance listed as a benefit (archived booklet).",
    eligible_nationalities: "Open to citizens of all countries (archived booklet). Confirm for the current call.",
    age_requirement: "Archived booklet: under 21 (undergraduate), under 30 (Master's), under 35 (PhD), under 45 (research). Confirm for the current call.",
    min_qualification: "Archived booklet: 70% for Bachelor's applicants, 90% for Medicine/Dentistry/Pharmacy, 75% for Master's and PhD. Confirm for the current call.",
    language_requirement: "One-year Turkish language course is part of the award (archived booklet).",
    duration: "Archived booklet: 1 year of Turkish plus 4–6 years (undergraduate), plus 2 years (Master's), plus 4 years (PhD).",
    deadline_note: "Not stated on the archived booklet. Check the current call at the official site.",
    eligibility_summary: "From an archived official booklet (not the current call): open to citizens of all countries; age and minimum-achievement limits apply by level. Current students in Türkiye cannot apply for their current level. Always read the current call.",
    last_verified: "2026-11-01",
  }),
  S("saudi-government-university-scholarships", "Saudi Government University Scholarships", "saudi-arabia", "Ministry of Education, Saudi Arabia", "https://studyinsaudi.moe.gov.sa/", 3),
  S("stipendium-hungaricum", "Stipendium Hungaricum", "hungary", "Government of Hungary (Tempus Public Foundation)", "https://stipendiumhungaricum.hu/", 4),
  S("daad-scholarships", "DAAD Scholarships", "germany", "German Academic Exchange Service (DAAD)", "https://www.daad.pk/en/find-funding/daad-scholarship-programmes-for-pakistan/", 5, {
    degree_levels: ["master", "doctoral", "research"],
    funding_details: "The DAAD Pakistan page we read does not state what each programme covers. Read the individual programme announcement.",
    duration: "From the DAAD Pakistan page: Master's programmes 1–2 years (public policy, development-related) or 10–24 months (architecture, art, design, film, music, performing arts); doctoral programmes 3 years; research grants 2–12 months.",
    disciplines: "Programmes listed include public policy & good governance, development-related courses, architecture, fine art/design/film, music, performing arts, medicine (research within a PhD), agricultural economics/bioeconomy/rural development, and others.",
    deadline_note: "The page gives typical deadlines: end of July (public policy), end of August (doctoral, research grants, medical doctors), end of September (architecture), start of October (music), end of October (performing arts), end of November (fine art/design/film). Confirm in the current announcement.",
    eligibility_summary: "Pakistan-specific DAAD programmes are listed by level (Master's, PhD, post-doc). Each has its own announcement and requirements; for medical doctors the page states the MBBS must be completed at the time of application.",
    last_verified: "2026-11-01",
  }),
  S("mext-scholarship-japan", "MEXT Scholarship (Japanese Government)", "japan", "MEXT, Government of Japan (administered via JASSO)", "https://studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/", 6, {
    degree_levels: ["bachelor", "research"],
    funding_type: "full",
    funding_details: "The official page lists: tuition exempted, round-trip airfare, and a monthly allowance that depends on the category.",
    tuition_coverage: "Tuition exempted.",
    stipend: "Monthly allowance by category as listed: research students ¥143,000–145,000; specialized training college ¥117,000; Young Leaders Program ¥242,000. Amounts can change; check the current guidelines.",
    airfare: "Round-trip airfare provided.",
    disciplines: "Categories: research students (graduate), teacher training, undergraduate, Japanese studies, college of technology, specialized training college, Young Leaders Program (one-year master's).",
    age_requirement: "Research and teacher training: under 35. Undergraduate, college of technology, specialized training college: under 25. Japanese studies: 18–29. Young Leaders Program: under 40 in principle.",
    min_qualification: "Research: eligible for a Japanese graduate programme. Undergraduate/specialized training: 12 years of schooling or equivalent. College of technology: 11+ years. Teacher training: college graduate with at least 5 years of teaching experience.",
    eligible_nationalities: "Not stated on the page we read. Confirm with the Embassy of Japan in Pakistan.",
    opens_note: "Embassy recommendation route: the embassy recruits and screens candidates (timing not specified on the page). University recommendation route: only some universities have quotas.",
    eligibility_summary: "Two application routes per the official page: Embassy recommendation (through the Japanese embassy) or University recommendation. The Young Leaders Program applies through overseas recommending organisations. Requirements differ by category.",
    deadline_note: "Dates are not stated on the page we read. Ask the Embassy of Japan or check the current guidelines.",
    last_verified: "2026-11-01",
  }),
  S("global-korea-scholarship-gks", "Global Korea Scholarship (GKS)", "south-korea", "National Institute for International Education (NIIED), Korea", "https://www.studyinkorea.go.kr/", 7),
  S("italian-government-maeci-scholarships", "Italian Government MAECI Scholarships", "italy", "Ministry of Foreign Affairs and International Cooperation (MAECI), Italy", "https://esteri.it/en/servizi-opportunita/opportunita/borse-di-studio/per-cittadini-stranieri/borsestudio_stranieri", 8),
  S("chevening-scholarship", "Chevening Scholarship", "united-kingdom", "UK Foreign, Commonwealth & Development Office (FCDO) and partners", "https://www.chevening.org/", 9),
  S("commonwealth-scholarships", "Commonwealth Scholarships (UK)", "united-kingdom", "Commonwealth Scholarship Commission (UK); nominations in Pakistan via HEC", "https://www.hec.gov.pk/english/HECAnnouncements/Pages/CW-Scholarship.aspx", 10, {
    degree_levels: ["master", "doctoral"],
    funding_details: "The HEC call page does not state what the scholarship covers; it says the scholarships support candidates who could not otherwise afford UK study. Read the CSC UK terms.",
    eligible_nationalities: "Pakistani / AJ&K nationals and permanent residents. Dual nationals are not eligible.",
    age_requirement: "No upper age limit.",
    min_qualification: "Master's: first division in a 16-year bachelor's degree in the relevant field. PhD: first division in a 17/18-year master's, MS or MPhil in the relevant field. No second or third division in the latest degree.",
    language_requirement: "",
    disciplines: "Studies fall under six Commonwealth Scholarship Commission development themes.",
    duration: "Full-time taught Master's or PhD at a UK university, starting September/October 2027 (for the 2027-28 call).",
    opens_note: "2027-28 call: portals opened 8 September 2026. Apply on BOTH the CSC online system and the HEC portal (scholarship.hec.gov.pk, “Learning Opportunities Abroad”); applications missing either are not accepted.",
    deadline: "2026-10-20",
    deadline_note: "2027-28 call closed on 20 October 2026 (CSC 16:00 BST; HEC 4:00 PM PST). The next call will be announced by HEC. A HAT score of at least 60/100 is required.",
    eligibility_summary: "From the HEC call for 2027-28: Pakistani/AJ&K nationals; first-division degrees as above; HAT minimum 60/100; application on both the CSC and HEC portals.",
    last_verified: "2026-11-01",
  }),
  S("fulbright-pakistan", "Fulbright Pakistan", "united-states", "United States Educational Foundation in Pakistan (USEFP)", "https://www.usefp.org/", 11),
  S("eiffel-excellence-scholarship", "Eiffel Excellence Scholarship", "france", "Campus France / French Ministry for Europe and Foreign Affairs", "https://www.campusfrance.org/en", 12),
  S("erasmus-mundus", "Erasmus Mundus Joint Masters", "europe", "European Commission (Erasmus+)", "https://erasmus-plus.ec.europa.eu/", 13),
  S("romanian-government-scholarships", "Romanian Government Scholarships", "romania", "Government of Romania (Ministry of Education)", "https://www.studyinromania.gov.ro/", 14),
  S("australia-awards", "Australia Awards", "australia", "Australian Government (DFAT)", "https://www.australiaawards.gov.au/", 15),
  S("qatar-university-scholarships", "Qatar University Scholarships", "qatar", "Qatar University", "https://www.qu.edu.qa/", 16),
  S("taiwan-government-scholarships", "Taiwan Government Scholarships", "taiwan", "Government of Taiwan (Ministry of Education; Ministry of Foreign Affairs)", "https://www.studyintaiwan.org/", 17),
  S("russian-government-scholarships", "Russian Government Scholarships", "russia", "Government of the Russian Federation", "https://education-in-russia.com/", 18),
  S("hec-international-scholarships", "HEC International Scholarships", "pakistan", "Higher Education Commission (HEC), Pakistan", "https://www.hec.gov.pk/", 19),
];

/** Study Abroad navigation (header dropdown, hub page). */
export const STUDY_MENU = [
  { href: "/study-abroad/destinations", label: "Study Destinations" },
  { href: "/study-abroad/universities", label: "Find Your University" },
  { href: "/scholarships", label: "Find Scholarships" },
  { href: "/study-abroad/fully-funded-scholarships", label: "Fully Funded Scholarships" },
  { href: "/study-abroad/tuition-free-universities", label: "Tuition-Free Universities" },
  { href: "/study-abroad/university-admissions", label: "University Admissions" },
  { href: "/study-abroad/student-visa-assistance", label: "Student Visa Assistance" },
  { href: "/study-abroad/application-process", label: "Application Process" },
  { href: "/study-abroad/consultation", label: "Study Abroad Consultation" },
];


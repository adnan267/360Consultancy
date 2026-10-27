/**
 * Document checklists for each visa route, as used by our team to collect
 * documents from clients.
 *
 * IMPORTANT: these lists come from our own operational checklist, NOT from an
 * official embassy or government source. Every list shows a notice that the
 * client must confirm the requirement on the official site, and the consultancy
 * may ask for more or different documents. Do not describe these as official.
 *
 * `docType` links an item to an upload type on the client portal. Items without
 * a docType are information the client supplies in the form (not a file).
 */
import type { DocType } from "@/lib/types";

export interface RequirementItem {
  label: string;
  docType?: DocType;
  note?: string;
}
export interface RequirementList {
  title: string;
  /** Applicant documents (the client's own). */
  applicant: RequirementItem[];
  /** Sponsor / host / employer documents, supplied by the sponsoring person or company. */
  sponsor?: RequirementItem[];
}

const PARENTS_INFO: RequirementItem = { label: "Parents' details (full name and nationality)" };
const SPOUSE_INFO: RequirementItem = { label: "Spouse details, if you are married" };
const CONTACT_INFO: RequirementItem = { label: "Complete home address, local contact number and working email ID" };

export const DOCUMENT_REQUIREMENTS: Record<string, RequirementList> = {
  "visit-tourist": {
    title: "Tourist visit visa",
    applicant: [
      { label: "Clear colour copy of passport", docType: "passport" },
      { label: "One white-background photograph (without eye glasses)", docType: "photo" },
      PARENTS_INFO,
      SPOUSE_INFO,
      CONTACT_INFO,
    ],
    sponsor: [
      { label: "Invitation letter / cover letter on affidavit (MOI)", docType: "invitation_letter" },
      { label: "Undertaking", docType: "sponsor_document" },
      { label: "Stay details", docType: "hotel_booking" },
      { label: "CNIC of sponsoring person", docType: "sponsor_document" },
      { label: "Local contact number and working email ID of sponsor" },
      { label: "Biometric verification of the sponsoring company person" },
    ],
  },
  "visit-business": {
    title: "Business entry visa",
    applicant: [
      { label: "Clear colour copy of passport", docType: "passport" },
      { label: "One white-background photograph (without eye glasses)", docType: "photo" },
      PARENTS_INFO,
      SPOUSE_INFO,
      { label: "Home or office complete address, local contact number and working email ID" },
      { label: "Applicant's company request letter", docType: "employer_letter" },
    ],
    sponsor: [
      { label: "Invitation letter on company letter head", docType: "invitation_letter" },
      { label: "NTN copy", docType: "sponsor_document" },
      { label: "Chamber membership certificate", docType: "sponsor_document" },
      { label: "E-invitation from local KCCI / LCCI / FCCI", docType: "sponsor_document" },
      { label: "CNIC of company representative", docType: "sponsor_document" },
      { label: "Local contact number and working email ID of sponsor company" },
      { label: "Biometric verification of the sponsor company person" },
      { label: "Company's account maintenance certificate from bank", docType: "bank_statement" },
    ],
  },
  "work-visa": {
    title: "Work visa",
    applicant: [
      { label: "Clear colour copy of passport", docType: "passport" },
      { label: "One white-background photograph (without eye glasses)", docType: "photo" },
      PARENTS_INFO,
      SPOUSE_INFO,
      CONTACT_INFO,
      { label: "CV", docType: "cv" },
    ],
    sponsor: [
      { label: "Signed and stamped contract (designation, salary, accommodation, duration, other facilities)", docType: "employer_letter" },
      { label: "Undertaking", docType: "sponsor_document" },
      { label: "Issuance of work permit", docType: "sponsor_document" },
      { label: "CNIC of sponsor person from company", docType: "sponsor_document" },
      { label: "Local contact number and working email ID of sponsor" },
      { label: "Biometric verification of the sponsor company person" },
      { label: "NTN certificate", docType: "sponsor_document" },
      { label: "Valid chamber of commerce certificates", docType: "sponsor_document" },
      { label: "E-bill", docType: "sponsor_document" },
    ],
  },
  "usa-visit": {
    title: "USA visit visa",
    applicant: [
      { label: "Clear colour copy of passport", docType: "passport" },
      { label: "Valid CNIC", docType: "cnic" },
      { label: "One white-background photograph (without eye glasses)", docType: "photo" },
      PARENTS_INFO,
      { label: "Family Registration Certificate (FRC)", docType: "family_registration" },
      { label: "Marriage Registration Certificate (MRC)", docType: "marriage_registration" },
      CONTACT_INFO,
      { label: "Work status (job or business)" },
      { label: "Company letter head (if business owner)", docType: "employer_letter" },
      { label: "NOC from company (if job holder)", docType: "employer_letter" },
      { label: "Invitation from USA, if any", docType: "invitation_letter" },
      { label: "Contact details of the invitee (company or person)" },
      { label: "Stay details (hotel bookings)", docType: "hotel_booking" },
      { label: "Travel dates (flight tickets)", docType: "flight_booking" },
      { label: "Detailed travel history", docType: "travel_history" },
      { label: "Visa refusal details of any country, if any", docType: "visa_refusal" },
    ],
  },
  "uk-visit": {
    title: "UK visit visa",
    applicant: [
      { label: "Clear colour copy of passport", docType: "passport" },
      { label: "Valid CNIC", docType: "cnic" },
      PARENTS_INFO,
      { label: "Family Registration Certificate (FRC)", docType: "family_registration" },
      { label: "Marriage Registration Certificate (MRC)", docType: "marriage_registration" },
      CONTACT_INFO,
      { label: "Work status (job or business)" },
      { label: "Income, savings, properties and expenditure details", docType: "financial" },
      { label: "Company letter head (if business owner)", docType: "employer_letter" },
      { label: "NOC from company (if job holder)", docType: "employer_letter" },
      { label: "Invitation from UK, if any", docType: "invitation_letter" },
      { label: "Contact details of the invitee (company or person)" },
      { label: "Stay details (hotel bookings)", docType: "hotel_booking" },
      { label: "Travel dates (flight tickets)", docType: "flight_booking" },
      { label: "Detailed travel history", docType: "travel_history" },
      { label: "Visa refusal details of any country, if any", docType: "visa_refusal" },
      { label: "Bank statements and account maintenance certificate (6 months)", docType: "bank_statement" },
      { label: "Income tax return (3 years)", docType: "income_tax_return" },
    ],
  },
  "canada-visit": {
    title: "Canada visit visa",
    applicant: [
      { label: "Clear colour copy of passport", docType: "passport" },
      { label: "CNIC", docType: "cnic" },
      { label: "One white-background photograph (without eye glasses)", docType: "photo" },
      PARENTS_INFO,
      { label: "Sibling details (name, date of birth, marital status, address)" },
      { label: "Family registration certificate (FRC)", docType: "family_registration" },
      { label: "Marriage registration certificate (MRC)", docType: "marriage_registration" },
      { label: "Home or office complete address, local contact number and working email ID" },
      { label: "Invitation from Canada, if any", docType: "invitation_letter" },
      { label: "Complete details of the invitee (name, contact, address, ID)" },
      { label: "Stay details (hotel bookings)", docType: "hotel_booking" },
      { label: "Flight schedule", docType: "flight_booking" },
      { label: "Bank statements", docType: "bank_statement" },
      { label: "Signed request letter / purpose of travel", docType: "other" },
    ],
  },
};

/** Maps a destination slug (see data/countries.ts) to its visit checklist, where we have one. */
export const DESTINATION_REQUIREMENT_KEY: Record<string, string> = {
  "united-states": "usa-visit",
  "united-kingdom": "uk-visit",
  canada: "canada-visit",
};

export const REQUIREMENT_NOTICE =
  "This list is from our own checklist, not from the official authority. Confirm each requirement on the official website for your visa category before you apply. The authority may ask for more or different documents, and our team may ask you for more.";

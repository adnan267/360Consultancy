-- Expand the allowed document types to match the visa document checklists
-- (CNIC, FRC/MRC, bank statements, tax returns, invitation, travel documents, etc.).
alter table public.case_documents drop constraint if exists case_documents_doc_type_check;
alter table public.case_documents add constraint case_documents_doc_type_check check (doc_type in (
  'passport', 'photo', 'cnic', 'transcript', 'certificate', 'experience_letter', 'cv', 'financial', 'bank_statement',
  'income_tax_return', 'language_test', 'admission_letter', 'family_registration', 'marriage_registration',
  'employer_letter', 'invitation_letter', 'hotel_booking', 'flight_booking', 'travel_history', 'visa_refusal',
  'sponsor_document', 'other'));

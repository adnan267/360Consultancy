import type { CaseStage, CaseStatus } from "./types";

/**
 * The staged flow. Each paid stage unlocks the next step; nothing moves forward
 * without an admin-verified payment, and only the listed moves exist.
 *
 *  awaiting_intake_payment ──(intake verified)──▶ documents_open
 *  documents_open ──(client requests review)──▶ awaiting_review_payment
 *  awaiting_review_payment ──(review verified)──▶ in_review
 *  in_review ──(staff completes review + sets quote)──▶ review_complete
 *  review_complete ──(client accepts quote)──▶ awaiting_submission_payment
 *  awaiting_submission_payment ──(submission verified)──▶ submission_in_progress
 *  submission_in_progress ──(staff records submission)──▶ submitted
 *  any non-final ──▶ cancelled
 */
export const CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  awaiting_intake_payment: ["documents_open", "cancelled"],
  documents_open: ["awaiting_review_payment", "cancelled"],
  awaiting_review_payment: ["in_review", "cancelled"],
  in_review: ["review_complete", "documents_open", "cancelled"], // back to documents_open if staff asks for fixes
  review_complete: ["awaiting_submission_payment", "completed", "cancelled"],
  awaiting_submission_payment: ["submission_in_progress", "cancelled"],
  submission_in_progress: ["submitted", "cancelled"],
  submitted: ["completed"],
  completed: [],
  cancelled: [],
};

export const canTransitionCase = (from: CaseStatus, to: CaseStatus) => CASE_TRANSITIONS[from].includes(to);

/** Which stage's payment is expected while the case is in each status. */
export const PAYING_STAGE: Partial<Record<CaseStatus, CaseStage>> = {
  awaiting_intake_payment: "intake",
  awaiting_review_payment: "review",
  awaiting_submission_payment: "submission",
};

/** What a verified payment of a stage unlocks. */
export const NEXT_AFTER_PAYMENT: Record<CaseStage, CaseStatus> = {
  intake: "documents_open",
  review: "in_review",
  submission: "submission_in_progress",
};

/** Documents can be added/removed only while the client is preparing them. */
export const UPLOADS_OPEN: CaseStatus[] = ["documents_open"];

export const FINAL_STATUSES: CaseStatus[] = ["completed", "cancelled"];

/** Staff may attach final files while the case is at or past review completion, until it is handed over. */
export const DELIVERABLES_OPEN: CaseStatus[] = ["review_complete", "submission_in_progress", "submitted"];

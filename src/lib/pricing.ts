import type { Service } from "./types";

export interface PayableBreakdown {
  currency: "PKR";
  consultancyFeePkr: number;
  /** Government / embassy fees are paid by the applicant directly to the authority and are never collected by us. */
  governmentFeesPkr: 0;
  totalPayablePkr: number;
  isStartingPrice: boolean;
}

/**
 * Server-side payable calculation. The ONLY input is the service row loaded
 * from the database — nothing supplied by the browser is ever used.
 */
export function calculatePayable(service: Pick<Service, "fee_pkr" | "fee_is_starting_price">): PayableBreakdown {
  if (!Number.isInteger(service.fee_pkr) || service.fee_pkr < 0) {
    throw new Error("Service fee is invalid");
  }
  return {
    currency: "PKR",
    consultancyFeePkr: service.fee_pkr,
    governmentFeesPkr: 0,
    totalPayablePkr: service.fee_pkr,
    isStartingPrice: service.fee_is_starting_price,
  };
}

export function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

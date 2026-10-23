import { createBookingRequest } from "@/lib/bookings";
import { bodyErrorResponse, clientIp, isSameOrigin, json, jsonError, readJson } from "@/lib/security";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  let body: unknown;
  try {
    body = await readJson(req);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  try {
    const result = await createBookingRequest(body, { ip: clientIp(req) });
    if (!result.ok) return json({ ok: false, error: result.error, fields: result.fields }, result.status);
    return json({ ok: true, booking: result.booking }, 201);
  } catch (e) {
    console.error("[POST /api/bookings]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}

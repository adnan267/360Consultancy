import type { CaseDocument } from "./types";

/** Always a download (never rendered inline on our origin), never cached, never sniffed. */
export function documentResponse(doc: CaseDocument, bytes: Uint8Array): Response {
  const safe = doc.original_name.replace(/[^\w.\- ]+/g, "_");
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": doc.mime,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(doc.original_name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

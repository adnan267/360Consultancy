import { beforeEach, describe, expect, it } from "vitest";
import { startChat, teamReply, visitorPoll, visitorSend } from "@/lib/chat";
import type { MemoryRepo } from "@/lib/repo";
import { freshRepo } from "./helpers";

let repo: MemoryRepo;
beforeEach(() => { repo = freshRepo(); });
const ctx = { ip: "5.5.5.5" };

describe("website chat", () => {
  it("starts a thread, stores only a token hash, and the visitor sees replies", async () => {
    const r = await startChat({ name: "Ali Raza", contact: "0300 1234567", message: "Visit visa for Turkey?" }, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(repo.chatThreads).toHaveLength(1);
    expect(repo.chatThreads[0].token_hash).not.toBe(r.token);
    expect((await visitorSend(r.token, { message: "Hello?" }, ctx)).ok).toBe(true);
    expect((await teamReply(repo.chatThreads[0].id, { message: "Assalam o Alaikum, yes." })).ok).toBe(true);
    const p = await visitorPoll(r.token);
    if (!p.ok) throw new Error(p.error);
    expect(p.messages.map((m) => m.sender)).toEqual(["visitor", "visitor", "team"]);
  });
  it("rejects a wrong token, bad input and honeypot starts", async () => {
    expect(await visitorPoll("0".repeat(48))).toMatchObject({ ok: false, status: 404 });
    expect(await visitorSend("nope", { message: "x" }, ctx)).toMatchObject({ ok: false, status: 404 });
    expect(await startChat({ name: "A", message: "" }, ctx)).toMatchObject({ ok: false, status: 422 });
    expect(await startChat({ name: "Bot Bot", message: "hi", website: "http://spam" }, ctx)).toMatchObject({ ok: true });
    expect(repo.chatThreads).toHaveLength(0);
  });
  it("limits how many chats one IP can start", async () => {
    for (let i = 0; i < 5; i++) expect((await startChat({ name: "Visitor", message: "hi" }, { ip: "9.9.9.1" })).ok).toBe(true);
    expect(await startChat({ name: "Visitor", message: "hi" }, { ip: "9.9.9.1" })).toMatchObject({ ok: false, status: 429 });
  });
});

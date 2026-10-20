"use client";
import { useState } from "react";

type Result = { ok?:boolean; error?:string; booking?:{id:string;created_at:string;amount_pkr:number} };
const labels:Record<string,string> = {
  consultation:"Visa Guidance Session",
  document_review:"Document Review",
  application_assistance:"Application Assistance"
};
export default function BookingForm() {
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<Result|null>(null);
  const [form,setForm]=useState({name:"",email:"",phone:"",service:"consultation",country:"",message:"",consent:false,website:""});
  function change(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) {
    const target=e.target;
    setForm(old=>({...old,[target.name]:target.type==="checkbox"?(target as HTMLInputElement).checked:target.value}));
  }
  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setResult(null);
    try {
      const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await r.json();setResult(data);
    } catch { setResult({error:"Network error. Please try again."}); }
    finally { setBusy(false); }
  }
  if(result?.ok && result.booking) return <div className="form-card">
    <div className="success"><strong>Request received.</strong><br/>Booking reference: <strong>{result.booking.id}</strong></div>
    <h3>Next step: bank transfer</h3>
    <p className="muted">This is a request, not a confirmed appointment. Transfer only after you have agreed the service scope and fee. The team must verify the transfer in the actual bank account before confirming.</p>
    <div className="notice">
      <p><strong>Bank:</strong> {process.env.NEXT_PUBLIC_BANK_NAME || "Bank details will be shared after manual review"}</p>
      <p><strong>Account title:</strong> {process.env.NEXT_PUBLIC_BANK_ACCOUNT_TITLE || "Not configured"}</p>
      <p><strong>Account number:</strong> {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "Not configured"}</p>
      <p><strong>IBAN:</strong> {process.env.NEXT_PUBLIC_BANK_IBAN || "Not configured"}</p>
      <p><strong>Amount:</strong> PKR {Number(result.booking.amount_pkr).toLocaleString()}</p>
      <p><strong>Transfer reference:</strong> {result.booking.id}</p>
    </div>
    <p className="small muted">Do not send your password, card PIN, OTP, or sensitive identity documents. If the bank details above are not configured or are not your verified business account, do not transfer money.</p>
  </div>;
  return <div className="form-card">
    {!process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER && <div className="notice" style={{marginBottom:16}}>Bank account details are not configured. This form should remain in private testing until verified business details and legal prerequisites are complete.</div>}
    <form onSubmit={submit} className="form-grid">
      <div><label htmlFor="name">Full name</label><input id="name" name="name" value={form.name} onChange={change} autoComplete="name" required minLength={2} maxLength={100}/></div>
      <div><label htmlFor="email">Email address</label><input id="email" name="email" type="email" value={form.email} onChange={change} autoComplete="email" required maxLength={254}/></div>
      <div><label htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" value={form.phone} onChange={change} autoComplete="tel" required minLength={7} maxLength={30}/></div>
      <div><label htmlFor="country">Country of interest</label><input id="country" name="country" value={form.country} onChange={change} placeholder="e.g. UAE, UK, Serbia" required minLength={2} maxLength={80}/></div>
      <div className="full"><label htmlFor="service">Select service</label><select id="service" name="service" value={form.service} onChange={change}><option value="consultation">Visa Guidance Session — PKR 1,500</option><option value="document_review">Document Review — PKR 3,500</option><option value="application_assistance">Application Assistance — PKR 7,500 starting</option></select></div>
      <div className="full"><label htmlFor="message">Briefly describe what guidance you need (optional)</label><textarea id="message" name="message" value={form.message} onChange={change} maxLength={1000} placeholder="Do not include passport numbers or other sensitive identity data."/></div>
      <div className="full" style={{display:"none"}} aria-hidden="true"><label htmlFor="website">Leave blank</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change}/></div>
      <div className="full"><label style={{display:"flex",gap:10,alignItems:"flex-start",fontWeight:500}}><input style={{width:18,marginTop:2}} type="checkbox" name="consent" checked={form.consent} onChange={change} required/><span>I agree that 360 Consultancy may contact me about this request and handle these details according to its privacy policy. I understand this is not a confirmed appointment and no visa outcome is guaranteed.</span></label></div>
      <div className="full"><button className="pill" disabled={busy}>{busy?"Submitting…":"Submit booking request"}</button></div>
    </form>
    {result?.error&&<p className="error" style={{marginTop:14}}>{result.error}</p>}
  </div>;
}

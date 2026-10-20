"use client";
import { useEffect, useState } from "react";

type Booking = {
 id:string; created_at:string; customer_name:string; customer_email:string; customer_phone:string;
 service:string; country:string; message:string|null; amount_pkr:number; payment_method:string;
 payment_status:string; booking_status:string;
};
const statuses = ["new","awaiting_payment","payment_review","confirmed","completed","cancelled"];
const payStatuses = ["unpaid","proof_submitted","verified","rejected","refunded"];
export default function AdminClient({ authenticated: initial }: { authenticated:boolean }) {
 const [authenticated,setAuthenticated] = useState(initial);
 const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
 const [bookings,setBookings] = useState<Booking[]>([]); const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
 async function load() {
   setError(""); const r=await fetch("/api/admin/bookings"); const d=await r.json();
   if(!r.ok){setError(d.error||"Unable to load bookings.");return;} setBookings(d.bookings||[]);
 }
 useEffect(()=>{if(authenticated) void load();},[authenticated]);
 async function login(e:React.FormEvent) {
   e.preventDefault();setBusy(true);setError("");
   try { const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw new Error(d.error);setAuthenticated(true);setPassword(""); }
   catch(err){setError(err instanceof Error?err.message:"Login failed.");}finally{setBusy(false);}
 }
 async function update(b:Booking,booking_status:string,payment_status:string) {
   setError("");setBusy(true);
   try {const r=await fetch("/api/admin/bookings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:b.id,booking_status,payment_status})});const d=await r.json();if(!r.ok)throw new Error(d.error);await load();}
   catch(err){setError(err instanceof Error?err.message:"Update failed.");}finally{setBusy(false);}
 }
 async function logout(){await fetch("/api/admin/logout",{method:"POST"});setAuthenticated(false);setBookings([]);}
 if(!authenticated) return <section className="form-card" style={{maxWidth:480,margin:"45px auto"}}><div className="tag">Restricted area</div><h2>Admin sign in</h2><p className="muted">Use the administrator credentials configured in Vercel environment variables.</p>
  <form onSubmit={login}><p><label>Email</label><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></p><p><label>Password</label><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></p><button className="pill" disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form>{error&&<p className="error">{error}</p>}</section>;
 return <section><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><div className="tag">Operations</div><h2>Booking dashboard</h2><p className="muted">Showing the latest 200 requests. Verify bank transfers in your actual bank account before marking them verified.</p></div><div style={{display:"flex",gap:8}}><button className="pill dark" onClick={()=>void load()}>Refresh</button><button className="pill" onClick={()=>void logout()}>Log out</button></div></div>
 {error&&<p className="error">{error}</p>}<div className="table-wrap"><table><thead><tr><th>Created / ID</th><th>Customer</th><th>Service</th><th>Fee</th><th>Payment</th><th>Booking status</th><th>Save</th></tr></thead><tbody>
 {bookings.map(b=><BookingRow key={b.id} b={b} busy={busy} onSave={update}/>)}{!bookings.length&&<tr><td colSpan={7}>No bookings found.</td></tr>}
 </tbody></table></div></section>;
}
function BookingRow({b,busy,onSave}:{b:Booking;busy:boolean;onSave:(b:Booking,s:string,p:string)=>void}) {
 const [s,setS]=useState(b.booking_status); const [p,setP]=useState(b.payment_status);
 return <tr><td>{new Date(b.created_at).toLocaleString()}<br/><span className="small muted">{b.id}</span></td><td><strong>{b.customer_name}</strong><br/>{b.customer_email}<br/>{b.customer_phone}<br/><span className="muted">Country: {b.country}</span>{b.message&&<p className="small">{b.message}</p>}</td><td>{b.service.replaceAll("_"," ")}</td><td>PKR {Number(b.amount_pkr).toLocaleString()}</td><td><select value={p} onChange={e=>setP(e.target.value)}>{payStatuses.map(x=><option key={x}>{x}</option>)}</select></td><td><select value={s} onChange={e=>setS(e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></td><td><button className="pill" disabled={busy} onClick={()=>onSave(b,s,p)}>Save</button></td></tr>;
}
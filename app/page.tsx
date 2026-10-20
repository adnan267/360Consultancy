import Link from "next/link";
import BookingForm from "./booking-form";

const services = [
  { icon:"🧭", title:"Visa Guidance Session", price:"Rs. 1,500", desc:"A 30-minute initial discussion to understand your goals and explain possible next steps." },
  { icon:"📋", title:"Document Review", price:"Rs. 3,500", desc:"A scoped review of your checklist and application information, with written feedback." },
  { icon:"🗂️", title:"Application Assistance", price:"Rs. 7,500+", desc:"Preparation support and document organization, subject to country rules and agreed scope." }
];

export default function Home() {
  const enabled = process.env.SERVICES_ENABLED === "true";
  return <>
    <div className="topbar"><div className="container">Online guidance • Transparent fees • No visa approval guarantees</div></div>
    <header className="container nav"><Link className="brand" href="/">360<span>Consultancy</span></Link><Link className="pill" href="#book">Book consultation</Link></header>
    <main>
      <section className="hero"><div className="container hero-grid">
        <div><div className="eyebrow">Your journey, better prepared</div><h1>Clear guidance for your next visa step.</h1>
          <p className="lead">Get organized, understand your options and prepare your next steps with online visa guidance from 360 Consultancy.</p>
          <p style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:26}}><Link className="pill" href="#book" style={{background:"#e2b85f",color:"#10233f"}}>Book a session →</Link><Link className="pill dark" href="#services">Explore services</Link></p>
          <p className="small" style={{color:"#d9e4ef",marginTop:22}}>Independent consultancy service. Government decisions are made by the relevant authorities.</p>
        </div>
        <div className="hero-panel"><div className="tag">How it works</div><h3>Simple, transparent, online.</h3><ol><li>Choose a service and submit your enquiry.</li><li>Receive booking instructions and bank transfer details.</li><li>We confirm payment manually and contact you to schedule.</li></ol><div className="notice">Please do not send passports or sensitive identity documents through the public booking form.</div></div>
      </div></section>
      <section className="section" id="services"><div className="container"><div className="section-head"><div className="tag">Our services</div><h2>Start with the right kind of support.</h2><p className="muted">Indicative consultancy prices. The final scope and fee must be confirmed before payment. Embassy and government fees are separate.</p></div>
        <div className="grid3">{services.map(s=><article className="card" key={s.title}><div className="iconbox">{s.icon}</div><h3>{s.title}</h3><p className="muted">{s.desc}</p><div className="price">{s.price}</div><p className="small muted">No approval, job or outcome guarantee.</p><Link className="pill" href="#book">Enquire now</Link></article>)}</div>
      </div></section>
      <section className="section" style={{background:"#edf3f8"}}><div className="container"><div className="section-head"><div className="tag">The process</div><h2>Know what happens next.</h2></div><div className="steps">
        {["Submit a booking request","Transfer the agreed fee","Get confirmation and guidance"].map((s,i)=><div className="card" key={s}><div className="tag">Step 0{i+1}</div><h3>{s}</h3><p className="muted">{["Tell us your contact details, preferred service and broad travel goal.","Use the displayed business bank details and include your booking reference in the transfer note.","Our team checks the transfer and contacts you using the details you supplied."][i]}</p></div>)}
      </div></div></section>
      <section className="section" id="book"><div className="container"><div className="section-head"><div className="tag">Booking request</div><h2>Request an online consultation.</h2><p className="muted">Submit your details below. This creates a request, not a confirmed appointment. We will contact you with the next steps.</p></div>
        {enabled ? <BookingForm /> : <div className="form-card"><div className="notice"><strong>Pre-launch mode:</strong> booking and paid service delivery are disabled until your legal authorization and business setup are confirmed. You can still prepare the site and test deployment privately.</div></div>}
      </div></section>
      <section className="section"><div className="container"><div className="notice"><strong>Important:</strong> 360 Consultancy is not a government department or embassy. Visa eligibility, processing times and decisions depend on the relevant authorities. We do not guarantee visas, jobs, work permits or approvals. Service availability is subject to applicable licensing and authorization requirements.</div></div></section>
    </main>
    <footer className="footer"><div className="container"><div className="brand" style={{color:"white"}}>360<span>Consultancy</span></div><p className="small">© {new Date().getFullYear()} 360 Consultancy. All rights reserved.</p><p className="small">Before launch, add verified business address/contact details, Privacy Policy, Terms of Service, Refund/Cancellation Policy and your confirmed authorization details.</p><p className="small"><Link href="/admin">Admin</Link></p></div></footer>
  </>;
}
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { portalEnabled, servicesEnabled } from "@/lib/env";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {!servicesEnabled() && (
        <div className="bg-gold-500 px-4 py-2 text-center text-sm font-semibold text-navy-950">
          Bookings are not open yet — browse our guidance in the meantime.
        </div>
      )}
      <Header portal={portalEnabled()} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <Container className="py-24 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-gold-700">Error 404</p>
          <h1 className="mt-3 text-4xl font-extrabold text-navy-900">We couldn&apos;t find that page</h1>
          <p className="mx-auto mt-4 max-w-md text-muted">The page may have moved or the link may be wrong. Try one of these instead.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Go home</ButtonLink>
            <ButtonLink href="/services" variant="secondary">Visa services</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

import { Container } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="py-12" aria-busy="true">
      <div className="h-24 animate-pulse rounded-2xl bg-navy-100" />
      <div className="mt-8 space-y-5">
        {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-mist" />)}
      </div>
      <p className="sr-only" role="status">Loading scholarships…</p>
    </Container>
  );
}

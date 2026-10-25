import { Container } from "@/components/ui/container";

type Service = { title: string; text: string };

/** Client service promises in a row of four (two on phones). */
export function ServicesStrip({ services }: { services: Service[] }) {
  return (
    <section className="border-t py-section" aria-label="Client services">
      <Container>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.title} className="flex flex-col gap-2">
              <h3 className="type-title-xs">{s.title}</h3>
              <p className="type-small text-muted">{s.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

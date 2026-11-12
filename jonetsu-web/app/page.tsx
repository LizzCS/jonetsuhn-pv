import Hero from "@/components/Hero";
import SectionCard from "@/components/SectionCard";
import Reveal from "@/components/Reveal";

const h2 = "font-display text-[clamp(1.5rem,4vw,1.875rem)] font-normal";

export default function Home() {
  return (
    <>
      <Hero />

      <section aria-labelledby="bienvenida">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <Reveal>
            <h2 id="bienvenida" className={h2}>
              Bienvenidos a Jonetsu
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/70">
              Preparamos cada plato por pedido. Elige un servicio, escoge tu
              horario y reserva lo que quieres comer.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="servicios" aria-labelledby="servicios-titulo" className="bg-mist/10">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 id="servicios-titulo" className={h2}>
              Servicios
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/70">
              Cada servicio tiene su fecha, sus horarios y un cupo limitado de
              platos. Revisa cuáles están abiertos.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <SectionCard
              href="/servicios"
              label="Ver servicios"
              tone="light"
              image="/images/servicios.jpg"
            />
          </Reveal>
        </div>
      </section>

      <section id="menu" aria-labelledby="menu-titulo" className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 id="menu-titulo" className={h2}>
              Menú
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-paper/70">
              Mira los platos disponibles, con su descripción y su precio.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <SectionCard
              href="/menu"
              label="Ver menú"
              tone="dark"
              image="/images/menu.jpg"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
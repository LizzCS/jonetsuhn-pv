import ImageSlot from "@/components/ImageSlot";
import Reveal from "@/components/Reveal";
import { platos } from "@/lib/data";

export const metadata = { title: "Menú - Jonetsu" };

export default function MenuPage() {
  return (
    <section
      aria-labelledby="menu-titulo"
      className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
    >
      <h1 id="menu-titulo" className="sr-only">
        Menú
      </h1>

      <ul className="grid gap-20 sm:gap-28">
        {platos.map((p, i) => (
          <li key={p.id}>
            <Reveal className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <ImageSlot
                src={p.imagenUrl}
                alt={p.nombre}
                className="aspect-[5/4]"
              />
              {/* Filas pares: texto a la izquierda. Impares: imagen a la izquierda. */}
              <div className={i % 2 === 0 ? "md:order-first" : ""}>
                <h2 className="font-display text-[clamp(1.5rem,4vw,1.875rem)] font-normal">
                  {p.nombre}
                </h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/70">
                  {p.descripcion}
                </p>
                <p className="mt-5 text-lg font-medium">L {p.precio}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

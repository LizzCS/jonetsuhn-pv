import ImageSlot from "@/components/ImageSlot";
import Reveal from "@/components/Reveal";
import { Suspense } from "react";
import { getPlatos } from "@/lib/api";

export const metadata = { title: "Menú - Jonetsu" };

export default function MenuPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-lg text-ink/60">Cargando menú…</p>}>
      <Menu />
    </Suspense>
  );
}

// Se pide al API en cada visita
async function Menu() {
  let platos;
  try {
    platos = await getPlatos();
  } catch (e) {
    return <p className="mx-auto max-w-6xl px-6 py-20 text-center text-lg text-ink/70">{(e as Error).message}</p>;
  }

  return (
    <section
      aria-labelledby="menu-titulo"
      className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
    >
      <h1 id="menu-titulo" className="sr-only">
        Menú
      </h1>

      {platos.length === 0 && (
        <p className="text-center text-lg text-ink/70">Aún no hay platos en el menú.</p>
      )}

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

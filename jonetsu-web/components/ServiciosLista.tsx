"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ImageSlot from "./ImageSlot";
import Reveal from "./Reveal";
import { formatFecha, type Servicio } from "@/lib/data";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun";

export default function ServiciosLista({ servicios }: { servicios: Servicio[] }) {
  const [abierto, setAbierto] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const visibles = useMemo(
    () =>
      [...servicios]
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .filter((s) => (!desde || s.fecha >= desde) && (!hasta || s.fecha <= hasta)),
    [servicios, desde, hasta],
  );

  const rango =
    visibles.length === 0
      ? null
      : visibles.length === 1
        ? formatFecha(visibles[0].fecha)
        : `${formatFecha(visibles[0].fecha)} – ${formatFecha(visibles[visibles.length - 1].fecha)}`;

  return (
    <section
      aria-labelledby="servicios-titulo"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="servicios-titulo"
            className="font-display text-[clamp(1.5rem,4vw,1.875rem)] font-normal"
          >
            Servicios
          </h2>
          {rango && <p className="mt-2 text-lg text-ink/70">{rango}</p>}
        </div>

        <button
          type="button"
          aria-expanded={abierto}
          aria-controls="filtro-fechas"
          onClick={() => setAbierto((a) => !a)}
          className={`inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2.5 text-base font-medium transition-colors hover:bg-ink hover:text-paper ${focus}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtro
        </button>
      </div>

      {abierto && (
        <div
          id="filtro-fechas"
          className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl bg-mist/10 p-5"
        >
          <label className="grid gap-1.5 text-sm">
            Desde
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Hasta
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setDesde("");
              setHasta("");
            }}
            className={`px-3 py-2 text-base underline underline-offset-4 hover:text-sun ${focus}`}
          >
            Limpiar
          </button>
        </div>
      )}

      {visibles.length === 0 ? (
        <p className="mt-16 text-center text-lg text-ink/70">
          No hay servicios en esas fechas. Cambia el rango o limpia el filtro.
        </p>
      ) : (
        <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {visibles.map((s, i) => (
            <li key={s.id}>
              <Reveal delay={(i % 2) * 120}>
                <Link
                  href={`/servicios/${s.id}`}
                  className={`group block rounded-2xl ${focus}`}
                >
                  <ImageSlot
                    src={s.imagenUrl}
                    alt={s.nombre}
                    className="aspect-[4/3]"
                  />
                  <h3 className="mt-5 font-display text-xl font-normal underline-offset-4 decoration-sun decoration-2 group-hover:underline">
                    {s.nombre}
                  </h3>
                  <p className="mt-1 text-base text-ink/60">{formatFecha(s.fecha)}</p>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-ink/70">
                    {s.descripcion}
                  </p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Reveal from "./Reveal";
import { cerrarSesion, useMontado, useSesion } from "@/lib/session";
import { formatFecha } from "@/lib/data";
import { ApiError, getMisTickets, logout } from "@/lib/api";
import {
  estadoLabel,
  formatHora,
  totalDe,
  type EstadoTicket,
  type TicketResumen,
} from "@/lib/tickets";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun";

const h2 = "font-display text-[clamp(1.5rem,4vw,1.875rem)] font-normal";

function Estado({ estado }: { estado: EstadoTicket }) {
  const punto =
    estado === "cancelado"
      ? "bg-sun"
      : estado === "confirmado" || estado === "entregado"
        ? "bg-ink"
        : "bg-mist";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-sm">
      <span aria-hidden="true" className={`size-2 rounded-full ${punto}`} />
      {estadoLabel[estado]}
    </span>
  );
}

export default function PerfilContenido() {
  const router = useRouter();
  const sesion = useSesion();
  const montado = useMontado();
  const saliendo = useRef(false);
  // null = cargando
  const [tickets, setTickets] = useState<TicketResumen[] | null>(null);
  const [errorTickets, setErrorTickets] = useState("");
  const esCliente = sesion?.tipo === "cliente";

  useEffect(() => {
    if (montado && !sesion && !saliendo.current) router.replace("/login");
  }, [montado, sesion, router]);

  // Historial real del API (la cookie access_token identifica al cliente)
  useEffect(() => {
    if (!esCliente) return;
    let vigente = true;
    getMisTickets()
      .then((t) => vigente && setTickets(t))
      .catch((err) => {
        if (!vigente) return;
        // La cookie venció o no existe: hay que iniciar sesión otra vez
        if (err instanceof ApiError && err.status === 401) {
          cerrarSesion();
          router.replace("/login");
          return;
        }
        setTickets([]);
        setErrorTickets("No pudimos cargar tus pedidos. Intenta de nuevo más tarde.");
      });
    return () => {
      vigente = false;
    };
  }, [esCliente, router]);

  async function salir() {
    saliendo.current = true;
    try {
      await logout();
    } catch {
      // aunque el API no responda, cerramos la sesión local
    }
    router.push("/");
    cerrarSesion();
  }

  if (!sesion) return <div className="min-h-[60vh]" aria-hidden="true" />;

  const datos = [
    { dt: "Nombre", dd: `${sesion.nombre} ${sesion.apellido}`.trim() },
    { dt: "Correo", dd: sesion.email },
    { dt: "Teléfono", dd: sesion.telefono || "No registrado" },
  ];

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <Reveal>
        <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-normal">
          Mi perfil
        </h1>

        <div className="mt-10 flex flex-wrap items-start justify-between gap-6 rounded-2xl bg-mist/10 p-6 sm:p-8">
          <dl className="grid gap-5 sm:grid-cols-2 sm:gap-x-12">
            {datos.map(({ dt, dd }) => (
              <div key={dt}>
                <dt className="text-sm text-ink/60">{dt}</dt>
                <dd className="mt-1 break-all text-lg">{dd}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={salir}
            className={`rounded-full border border-ink px-5 py-2.5 text-base font-medium transition-colors hover:bg-ink hover:text-paper ${focus}`}
          >
            Cerrar sesión
          </button>
        </div>
      </Reveal>

      <h2 className={`${h2} mt-20`}>Historial de pedidos</h2>

      {sesion.tipo === "invitado" ? (
        <p className="mt-5 text-lg leading-relaxed text-ink/70">
          Estás como invitado.{" "}
          <Link href="/login" className={`underline underline-offset-4 hover:text-sun ${focus}`}>
            Inicia sesión
          </Link>{" "}
          para ver tus pedidos.
        </p>
      ) : tickets === null ? (
        <p className="mt-5 text-lg leading-relaxed text-ink/70">Cargando pedidos…</p>
      ) : errorTickets ? (
        <p role="alert" className="mt-5 text-lg leading-relaxed text-sun">
          {errorTickets}
        </p>
      ) : tickets.length === 0 ? (
        <p className="mt-5 text-lg leading-relaxed text-ink/70">
          Todavía no tienes pedidos. Reserva en un servicio y aparecerá aquí.{" "}
          <Link href="/servicios" className={`underline underline-offset-4 hover:text-sun ${focus}`}>
            Ver servicios
          </Link>
        </p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {tickets.map((t) => (
            <li key={t.id}>
              <Reveal>
                <details className="group rounded-2xl border border-ink/15 p-5 open:bg-mist/10 sm:p-6">
                  <summary
                    className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg [&::-webkit-details-marker]:hidden ${focus}`}
                  >
                    <span>
                      <span className="block font-display text-xl">
                        Pedido {t.codigoAcceso}
                      </span>
                      <span className="mt-1 block text-base text-ink/70">
                        {t.servicio}, {formatFecha(t.fecha)}, {formatHora(t.hora)}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      <Estado estado={t.estado} />
                      <span className="text-lg font-medium">L {totalDe(t)}</span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="transition-transform group-open:rotate-180"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>

                  <ul className="mt-5 grid gap-2 border-t border-ink/10 pt-5 text-base">
                    {t.items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-4">
                        <span>
                          {i.cantidad} × {i.nombre}
                        </span>
                        <span>L {i.cantidad * i.precioUnitario}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

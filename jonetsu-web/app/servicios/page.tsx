import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import ServiciosLista from "@/components/ServiciosLista";
import { getServicios } from "@/lib/api";

export const metadata = { title: "Servicios - Jonetsu" };

// Se pide al API en cada visita (los cupos cambian); el encabezado sale de inmediato.
async function Servicios() {
  try {
    return <ServiciosLista servicios={await getServicios()} />;
  } catch (e) {
    return <AvisoError mensaje={(e as Error).message} />;
  }
}

function AvisoError({ mensaje }: { mensaje: string }) {
  return <p className="mx-auto max-w-6xl px-6 py-20 text-center text-lg text-ink/70">{mensaje}</p>;
}

export default function ServiciosPage() {
  return (
    <>
      <PageHeader />
      <Suspense fallback={<p className="py-20 text-center text-lg text-ink/60">Cargando servicios…</p>}>
        <Servicios />
      </Suspense>
    </>
  );
}

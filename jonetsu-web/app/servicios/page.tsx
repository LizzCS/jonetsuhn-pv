import PageHeader from "@/components/PageHeader";
import ServiciosLista from "@/components/ServiciosLista";
import { servicios } from "@/lib/data";

export const metadata = { title: "Servicios - Jonetsu" };

export default function ServiciosPage() {
  return (
    <>
      <PageHeader />
      <ServiciosLista servicios={servicios} />
    </>
  );
}

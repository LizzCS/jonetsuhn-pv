import Hero from "@/components/Hero";
import TextSection from "@/components/TextSection";

export const metadata = { title: "Sobre nosotros - Jonetsu" };

// Textos de ejemplo: reemplázalos por los reales del negocio.
export default function SobreNosotrosPage() {
  return (
    <>
      <Hero />

      <TextSection id="sobre-nosotros" titulo="Sobre nosotros">
        Jonetsu es una cocina japonesa que trabaja por pedido. Cada servicio
        tiene un cupo limitado de platos, así todo se prepara fresco y a tiempo.
      </TextSection>

      <TextSection id="como-funciona" titulo="Cómo funciona" tone="mist">
        Elige un servicio, escoge un horario disponible y haz tu pedido. Al
        confirmarse el pago, verás el lugar y la hora de tu servicio.
      </TextSection>

      <TextSection id="contacto" titulo="Contáctanos" tone="ink">
        ¿Tienes dudas sobre un pedido? Escríbenos por nuestras redes sociales.
      </TextSection>
    </>
  );
}

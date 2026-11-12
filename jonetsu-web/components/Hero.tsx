export default function Hero() {
  return (
    <section
      className="bg-ink text-paper"
      style={{
        // Para usar una foto: guarda public/images/hero.jpg. Si no existe, queda el fondo negro.
        backgroundImage:
          "linear-gradient(rgb(0 0 0 / 0.6), rgb(0 0 0 / 0.6)), url('/images/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="sun-enter grid aspect-square w-[min(72vw,22rem)] place-items-center rounded-full bg-sun">
          <h1 className="font-display text-[clamp(2rem,8vw,3rem)] font-normal">
            Jonetsu
          </h1>
        </div>
        <p className="mt-10 font-display text-2xl font-normal">
          Japanese Kitchen
        </p>
        <p className="mt-3 max-w-md text-base text-paper/75">
          Cocina japonesa por pedido, en San Pedro Sula.
        </p>
      </div>
    </section>
  );
}

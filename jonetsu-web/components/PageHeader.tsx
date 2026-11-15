export default function PageHeader({ image }: { image?: string }) {
  return (
    <section
      className="bg-ink text-paper"
      style={
        image
          ? {
              backgroundImage: `linear-gradient(rgb(0 0 0 / 0.6), rgb(0 0 0 / 0.6)), url('${image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:py-24">
        <span
          aria-hidden="true"
          className="mx-auto mb-6 block size-4 rounded-full bg-sun"
        />
        <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-normal">
          Jonetsu
        </h1>
        <p className="mt-3 text-lg text-paper/75">Japanese Kitchen</p>
      </div>
    </section>
  );
}

import Reveal from "./Reveal";

type Props = {
  id: string;
  titulo: string;
  tone?: "paper" | "mist" | "ink";
  children: React.ReactNode;
};

const tones = {
  paper: "bg-paper text-ink",
  mist: "bg-mist/10 text-ink",
  ink: "bg-ink text-paper",
};

export default function TextSection({ id, titulo, tone = "paper", children }: Props) {
  const dark = tone === "ink";

  return (
    <section aria-labelledby={id} className={tones[tone]}>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Reveal>
          <h2
            id={id}
            className="font-display text-[clamp(1.5rem,4vw,1.875rem)] font-normal"
          >
            {titulo}
          </h2>
          <p
            className={`mt-5 text-lg leading-relaxed ${
              dark ? "text-paper/70" : "text-ink/70"
            }`}
          >
            {children}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

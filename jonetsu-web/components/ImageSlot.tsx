type Props = {
  src?: string | null; // URL de la imagen que suba el admin
  alt: string;
  className?: string; // define la proporción, ej. "aspect-[4/3]"
};

export default function ImageSlot({ src, alt, className = "" }: Props) {
  const base = `relative overflow-hidden rounded-2xl bg-mist/25 ${className}`;

  if (src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={base}
        style={{
          backgroundImage: `url('${src}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  // Espacio reservado hasta que el admin suba la imagen
  return (
    <div aria-hidden="true" className={`${base} grid place-items-center text-ink/30`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="m21 16-5-5-8 9" />
      </svg>
    </div>
  );
}

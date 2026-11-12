import Link from "next/link";

type Props = {
  href: string;
  label: string;
  tone: "light" | "dark";
  image?: string; // ruta dentro de /public; si no existe se ve el color de fondo
};

export default function SectionCard({ href, label, tone, image }: Props) {
  const dark = tone === "dark";

  return (
    <div
      className={`mt-14 flex aspect-[4/3] items-end rounded-2xl p-6 sm:aspect-[21/9] sm:p-10 ${
        dark ? "bg-paper/5 ring-1 ring-paper/15" : "bg-mist"
      }`}
      style={
        image
          ? {
              backgroundImage: `url('${image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <Link
        href={href}
        className={`rounded-full px-6 py-3 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun ${
          dark
            ? "bg-paper text-ink hover:bg-paper/85"
            : "bg-ink text-paper hover:bg-ink/85"
        }`}
      >
        {label}
      </Link>
    </div>
  );
}

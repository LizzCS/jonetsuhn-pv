const social = [
  { label: "Instagram", href: "#" },
  { label: "WhatsApp", href: "#" },
  { label: "Facebook", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between">
        <p className="font-display text-xl">Jonetsu Japanese Kitchen</p>
        <ul className="flex gap-8">
          {social.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="text-base transition-colors hover:text-sun focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="pb-10 text-center text-sm text-ink/60">
      © Jonetsu Japanese Kitchen
      </p>
    </footer>
  );
}

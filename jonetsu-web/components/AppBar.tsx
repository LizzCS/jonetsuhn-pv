"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/servicios", label: "Servicios" },
  { href: "/menu", label: "Menú" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
];

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun";

export default function AppBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Reemplaza este texto por el logo real (public/logo.svg) cuando lo tengas */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Jonetsu, ir al inicio"
          className={`flex items-center font-display text-xl tracking-[0.18em] ${focus}`}
        >
          J
          <span
            aria-hidden="true"
            className="mx-[0.12em] inline-block size-[0.78em] rounded-full bg-sun"
          />
          NETSU
        </Link>

        <div className="flex items-center gap-10">
          <nav aria-label="Principal" className="hidden items-center gap-10 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`text-base transition-colors hover:text-sun aria-[current=page]:underline aria-[current=page]:decoration-sun aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8 ${focus}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              aria-label="Perfil"
              className={`grid size-10 place-items-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-paper ${focus}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </Link>

            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls="menu-movil"
              onClick={() => setOpen((o) => !o)}
              className={`grid size-10 place-items-center md:hidden ${focus}`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav
          id="menu-movil"
          aria-label="Principal móvil"
          className="border-t border-ink/10 md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-6 py-2">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === href ? "page" : undefined}
                  className={`block py-3 text-lg aria-[current=page]:text-sun ${focus}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

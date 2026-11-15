"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "./Campo";
import { guardarSesion, useMontado, useSesion } from "@/lib/session";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun";

const boton = `w-full rounded-full bg-ink px-6 py-3 text-base font-medium text-paper transition-colors hover:bg-ink/85 ${focus}`;

export default function AccesoForm() {
  const router = useRouter();
  const sesion = useSesion();
  const montado = useMontado();
  const [modo, setModo] = useState<"invitado" | "login">("invitado");

  // Quien ya inició sesión no necesita pasar por aquí
  useEffect(() => {
    if (montado && sesion?.tipo === "cliente") router.replace("/perfil");
  }, [montado, sesion, router]);

  function texto(f: FormData, campo: string) {
    return String(f.get(campo) ?? "").trim();
  }

  function continuarInvitado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    guardarSesion({
      tipo: "invitado",
      nombre: texto(f, "nombre"),
      apellido: texto(f, "apellido"),
      email: texto(f, "email"),
      telefono: texto(f, "telefono"),
    });
    router.push("/servicios");
  }

  function iniciarSesion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    // TODO: reemplazar por el login real del API. Por ahora acepta cualquier dato.
    guardarSesion({
      tipo: "cliente",
      nombre: "Cliente",
      apellido: "Demo",
      email: texto(f, "email"),
      telefono: "",
    });
    router.push("/perfil");
  }

  return (
    <section className="mx-auto max-w-md px-6 py-16 sm:py-24">
      <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-normal">
        Continúa con tu pedido
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/70">
        Inicia sesión para ver tu historial, o sigue como invitado.
      </p>

      <div className="mt-10 grid grid-cols-2 rounded-full bg-mist/15 p-1">
        {(["invitado", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => setModo(m)}
            className={`rounded-full py-2.5 text-base font-medium transition-colors ${focus} ${
              modo === m ? "bg-ink text-paper" : "text-ink/70 hover:text-ink"
            }`}
          >
            {m === "invitado" ? "Invitado" : "Iniciar sesión"}
          </button>
        ))}
      </div>

      {modo === "invitado" ? (
        <form onSubmit={continuarInvitado} className="mt-8 grid gap-5">
          <Campo label="Nombre" name="nombre" autoComplete="given-name" maxLength={100} required />
          <Campo label="Apellido" name="apellido" autoComplete="family-name" maxLength={100} required />
          <Campo label="Correo" name="email" type="email" autoComplete="email" maxLength={100} required />
          <Campo label="Número telefónico" name="telefono" type="tel" autoComplete="tel" maxLength={20} required />
          <button type="submit" className={`${boton} mt-2`}>
            Continuar como invitado
          </button>
        </form>
      ) : (
        <form onSubmit={iniciarSesion} className="mt-8 grid gap-5">
          <Campo label="Correo" name="email" type="email" autoComplete="email" maxLength={100} required />
          <Campo label="Contraseña" name="password" type="password" autoComplete="current-password" required />
          <button type="submit" className={`${boton} mt-2`}>
            Iniciar sesión
          </button>
        </form>
      )}
    </section>
  );
}

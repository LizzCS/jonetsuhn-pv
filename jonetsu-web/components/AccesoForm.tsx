"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "./Campo";
import { guardarSesion, useMontado, useSesion } from "@/lib/session";
import { aSesion, login } from "@/lib/api";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun";

const boton = `w-full rounded-full bg-ink px-6 py-3 text-base font-medium text-paper transition-colors hover:bg-ink/85 disabled:cursor-wait disabled:opacity-60 ${focus}`;

export default function AccesoForm() {
  const router = useRouter();
  const sesion = useSesion();
  const montado = useMontado();
  const [modo, setModo] = useState<"invitado" | "login">("invitado");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

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

  async function iniciarSesion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setError("");
    try {
      const usuario = await login(texto(f, "email"), String(f.get("password") ?? ""));
      guardarSesion(aSesion(usuario));
      router.push("/perfil");
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "No pudimos conectar con el servidor. Intenta de nuevo.",
      );
      setEnviando(false);
    }
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
            onClick={() => {
              setModo(m);
              setError("");
            }}
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
          {error && (
            <p role="alert" className="text-base text-sun">
              {error}
            </p>
          )}
          <button type="submit" disabled={enviando} className={`${boton} mt-2`}>
            {enviando ? "Ingresando…" : "Iniciar sesión"}
          </button>
          <p className="text-center text-base text-ink/70">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className={`underline underline-offset-4 hover:text-sun ${focus}`}>
              Crear cuenta
            </Link>
          </p>
        </form>
      )}
    </section>
  );
}

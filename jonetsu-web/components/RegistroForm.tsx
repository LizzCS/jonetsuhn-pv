"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "./Campo";
import { guardarSesion, useMontado, useSesion } from "@/lib/session";
import { aSesion, reenviarCodigo, registrar, verificarCorreo } from "@/lib/api";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun";

const boton = `w-full rounded-full bg-ink px-6 py-3 text-base font-medium text-paper transition-colors hover:bg-ink/85 disabled:cursor-wait disabled:opacity-60 ${focus}`;

const enlace = `underline underline-offset-4 hover:text-sun disabled:cursor-wait disabled:opacity-60 ${focus}`;

function mensajeDe(err: unknown) {
  return err instanceof Error && err.message !== "Failed to fetch"
    ? err.message
    : "No pudimos conectar con el servidor. Intenta de nuevo.";
}

function texto(f: FormData, campo: string) {
  return String(f.get(campo) ?? "").trim();
}

// Registro en dos pasos (como el API):
// 1. Datos de la cuenta → el API manda un código de 6 dígitos al correo.
// 2. Código → se crea la cuenta y queda la sesión iniciada.
export default function RegistroForm() {
  const router = useRouter();
  const sesion = useSesion();
  const montado = useMontado();
  const [email, setEmail] = useState<string | null>(null); // null = paso 1
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Quien ya inició sesión no necesita crear cuenta
  useEffect(() => {
    if (montado && sesion?.tipo === "cliente") router.replace("/perfil");
  }, [montado, sesion, router]);

  async function crearCuenta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");

    if (password !== String(f.get("confirmar") ?? "")) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    setError("");
    try {
      const r = await registrar({
        nombre: texto(f, "nombre"),
        apellido: texto(f, "apellido"),
        email: texto(f, "email").toLowerCase(),
        telefono: texto(f, "telefono"),
        password,
      });
      setEmail(r.email);
      setAviso(`${r.message}. El código vence en ${r.minutos} minutos.`);
    } catch (err) {
      setError(mensajeDe(err));
    } finally {
      setEnviando(false);
    }
  }

  async function verificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    const f = new FormData(e.currentTarget);

    setEnviando(true);
    setError("");
    try {
      const usuario = await verificarCorreo(email, texto(f, "codigo"));
      guardarSesion(aSesion(usuario));
      router.push("/perfil");
    } catch (err) {
      setError(mensajeDe(err));
      setEnviando(false);
    }
  }

  async function reenviar() {
    if (!email) return;
    setEnviando(true);
    setError("");
    try {
      const r = await reenviarCodigo(email);
      setAviso(`${r.message}. El código vence en ${r.minutos} minutos.`);
    } catch (err) {
      setError(mensajeDe(err));
    } finally {
      setEnviando(false);
    }
  }

  const alerta = error && (
    <p role="alert" className="text-base text-sun">
      {error}
    </p>
  );

  return (
    <section className="mx-auto max-w-md px-6 py-16 sm:py-24">
      <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-normal">
        {email ? "Revisa tu correo" : "Crea tu cuenta"}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/70">
        {email
          ? aviso
          : "Con una cuenta puedes ver el historial de tus pedidos."}
      </p>

      {email === null ? (
        <form onSubmit={crearCuenta} className="mt-10 grid gap-5">
          <Campo label="Nombre" name="nombre" autoComplete="given-name" maxLength={100} required />
          <Campo label="Apellido" name="apellido" autoComplete="family-name" maxLength={100} required />
          <Campo label="Correo" name="email" type="email" autoComplete="email" maxLength={254} required />
          <Campo label="Número telefónico" name="telefono" type="tel" autoComplete="tel" maxLength={20} required />
          <Campo
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
          <Campo
            label="Confirmar contraseña"
            name="confirmar"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
          {alerta}
          <button type="submit" disabled={enviando} className={`${boton} mt-2`}>
            {enviando ? "Enviando código…" : "Crear cuenta"}
          </button>
          <p className="text-center text-base text-ink/70">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className={enlace}>
              Inicia sesión
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={verificar} className="mt-10 grid gap-5">
          <Campo
            label="Código de verificación"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{3}[\s-]?\d{3}"
            maxLength={7}
            placeholder="123456"
            required
          />
          {alerta}
          <button type="submit" disabled={enviando} className={`${boton} mt-2`}>
            {enviando ? "Verificando…" : "Verificar y entrar"}
          </button>
          <p className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-base text-ink/70">
            <button type="button" onClick={reenviar} disabled={enviando} className={enlace}>
              Reenviar código
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail(null);
                setError("");
              }}
              disabled={enviando}
              className={enlace}
            >
              Cambiar datos
            </button>
          </p>
        </form>
      )}
    </section>
  );
}

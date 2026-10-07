"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo iniciar sesión.");

      const destination = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
      router.replace(destination);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="panel login-panel" onSubmit={submit}>
        <span className="brand-mark login-mark" aria-hidden="true">✦</span>
        <span className="eyebrow">ACCESO RESTRINGIDO</span>
        <h1>Registro aeronáutico</h1>
        <p>Inicia sesión para acceder al inventario y al historial.</p>

        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <label className="field">
          <span>Usuario</span>
          <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button className="button button-primary login-submit" type="submit" disabled={loading}>
          {loading ? "Verificando…" : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}

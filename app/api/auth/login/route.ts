import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  verifyCredentials,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud de inicio de sesión no es válida." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("username" in body) ||
    !("password" in body) ||
    typeof body.username !== "string" ||
    typeof body.password !== "string" ||
    body.username.length > 160 ||
    body.password.length > 1024 ||
    !body.username ||
    !body.password
  ) {
    return NextResponse.json({ error: "Ingresa el usuario y la contraseña." }, { status: 400 });
  }

  try {
    if (!verifyCredentials(body.username, body.password)) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    const response = NextResponse.json({ message: "Sesión iniciada." });
    response.cookies.set(SESSION_COOKIE, createSession(body.username), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión. Verifica la configuración de acceso." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  let username: string | null;
  try {
    username = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  } catch (error) {
    console.error("Configuración de autenticación incompleta:", error);
    return new NextResponse("El acceso no está configurado. Define las variables de autenticación.", { status: 503 });
  }

  if (username) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Debes iniciar sesión para realizar esta operación." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

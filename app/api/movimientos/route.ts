import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getSql } from "@/lib/db";
import { parseInstrumentoId } from "@/lib/instrumentos";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cursorValue = request.nextUrl.searchParams.get("before");
  const cursor = cursorValue ? parseInstrumentoId(cursorValue) : null;
  if (cursorValue && cursor === null) {
    return NextResponse.json({ error: "El cursor del historial no es válido." }, { status: 400 });
  }

  try {
    await ensureDatabase();
    const rows = cursor
      ? await getSql()`
          SELECT id, instrumento_id, accion, datos_anteriores, datos_nuevos, fecha
          FROM instrumento_movimientos
          WHERE id < ${cursor}
          ORDER BY id DESC
          LIMIT 51
        `
      : await getSql()`
          SELECT id, instrumento_id, accion, datos_anteriores, datos_nuevos, fecha
          FROM instrumento_movimientos
          ORDER BY id DESC
          LIMIT 51
        `;
    const hasMore = rows.length > 50;
    const movimientos = rows.slice(0, 50);

    return NextResponse.json({
      movimientos,
      siguienteCursor: hasMore ? String(movimientos[movimientos.length - 1].id) : null,
    });
  } catch (error) {
    console.error("Error al consultar el historial de movimientos:", error);
    return NextResponse.json({ error: "No se pudo consultar el historial de movimientos." }, { status: 500 });
  }
}

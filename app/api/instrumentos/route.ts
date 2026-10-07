import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getSql } from "@/lib/db";
import { instrumentoSchema, validateImage } from "@/lib/instrumentos";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const rows = search
      ? await getSql()`
          SELECT id, persona_carga, nombre_instrumento, numero_parte, numero_serie, foto_url, fecha_carga
          FROM instrumentos
          WHERE persona_carga ILIKE ${`%${search}%`}
             OR nombre_instrumento ILIKE ${`%${search}%`}
             OR numero_parte ILIKE ${`%${search}%`}
             OR numero_serie ILIKE ${`%${search}%`}
          ORDER BY fecha_carga DESC, id DESC
        `
      : await getSql()`
          SELECT id, persona_carga, nombre_instrumento, numero_parte, numero_serie, foto_url, fecha_carga
          FROM instrumentos
          ORDER BY fecha_carga DESC, id DESC
        `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar instrumentos:", error);
    return errorResponse("No se pudieron consultar los instrumentos. Verifica la configuración de la base de datos.", 500);
  }
}

export async function POST(request: NextRequest) {
  let uploadedUrl: string | undefined;

  try {
    const form = await request.formData();
    const parsed = instrumentoSchema.safeParse({
      persona_carga: form.get("persona_carga"),
      nombre_instrumento: form.get("nombre_instrumento"),
      numero_parte: form.get("numero_parte"),
      numero_serie: form.get("numero_serie"),
    });

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Los datos ingresados no son válidos.", 400);
    }

    const candidate = form.get("foto");
    let fotoUrl: string | null = null;

    if (candidate !== null && !(candidate instanceof File)) {
      return errorResponse("El archivo de foto no es válido.", 400);
    }

    if (candidate instanceof File && candidate.size > 0) {
      const imageError = await validateImage(candidate);
      if (imageError) {
        return errorResponse(imageError, 400);
      }
      const blob = await put(candidate.name, candidate, {
        access: "public",
        addRandomSuffix: true,
        contentType: candidate.type,
      });
      uploadedUrl = blob.url;
      fotoUrl = blob.url;
    }

    await ensureDatabase();
    const [instrumento] = await getSql().begin(async (transaction) => {
      const [created] = await transaction`
        INSERT INTO instrumentos (persona_carga, nombre_instrumento, numero_parte, numero_serie, foto_url)
        VALUES (${parsed.data.persona_carga}, ${parsed.data.nombre_instrumento}, ${parsed.data.numero_parte}, ${parsed.data.numero_serie}, ${fotoUrl})
        RETURNING id, persona_carga, nombre_instrumento, numero_parte, numero_serie, foto_url, fecha_carga
      `;
      await transaction`
        INSERT INTO instrumento_movimientos (instrumento_id, accion, datos_nuevos)
        VALUES (${created.id}, 'creado', ${JSON.stringify(created)}::jsonb)
      `;
      return [created];
    });

    return NextResponse.json(instrumento, { status: 201 });
  } catch (error) {
    console.error("Error al crear instrumento:", error);
    if (uploadedUrl) {
      try {
        const { del } = await import("@vercel/blob");
        await del(uploadedUrl);
      } catch (cleanupError) {
        console.error("No se pudo limpiar la fotografía tras fallar la creación:", cleanupError);
      }
    }
    return errorResponse("No se pudo guardar el instrumento. Comprueba la conexión con Neon y que Vercel Blob esté conectado al proyecto; para desarrollo local configura BLOB_READ_WRITE_TOKEN.", 500);
  }
}

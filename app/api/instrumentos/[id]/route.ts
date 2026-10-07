import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getSql } from "@/lib/db";
import { instrumentoSchema, parseInstrumentoId, validateImage } from "@/lib/instrumentos";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getId(context: RouteContext): Promise<number | null> {
  const { id } = await context.params;
  return parseInstrumentoId(id);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const id = await getId(context);
  if (id === null) {
    return errorResponse("El identificador del instrumento no es válido.", 400);
  }

  try {
    await ensureDatabase();
    const [instrumento] = await getSql()`
      SELECT id, persona_carga, nombre_instrumento, numero_parte, numero_serie, foto_url, fecha_carga
      FROM instrumentos
      WHERE id = ${id}
    `;
    return instrumento
      ? NextResponse.json(instrumento)
      : errorResponse("No se encontró el instrumento solicitado.", 404);
  } catch (error) {
    console.error("Error al consultar instrumento:", error);
    return errorResponse("No se pudo consultar el instrumento.", 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const id = await getId(context);
  if (id === null) {
    return errorResponse("El identificador del instrumento no es válido.", 400);
  }

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
    if (candidate !== null && !(candidate instanceof File)) {
      return errorResponse("El archivo de foto no es válido.", 400);
    }

    let fotoUrl: string | null | undefined;
    if (candidate instanceof File && candidate.size > 0) {
      const imageError = await validateImage(candidate);
      if (imageError) {
        return errorResponse(imageError, 400);
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return errorResponse("Falta configurar BLOB_READ_WRITE_TOKEN para subir fotografías.", 500);
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
    const [existing] = await getSql()`SELECT foto_url FROM instrumentos WHERE id = ${id}`;
    if (!existing) {
      if (uploadedUrl && process.env.BLOB_READ_WRITE_TOKEN) await del(uploadedUrl);
      return errorResponse("No se encontró el instrumento solicitado.", 404);
    }

    const [instrumento] = fotoUrl === undefined
      ? await getSql()`
          UPDATE instrumentos
          SET persona_carga = ${parsed.data.persona_carga},
              nombre_instrumento = ${parsed.data.nombre_instrumento},
              numero_parte = ${parsed.data.numero_parte},
              numero_serie = ${parsed.data.numero_serie}
          WHERE id = ${id}
          RETURNING id, persona_carga, nombre_instrumento, numero_parte, numero_serie, foto_url, fecha_carga
        `
      : await getSql()`
          UPDATE instrumentos
          SET persona_carga = ${parsed.data.persona_carga},
              nombre_instrumento = ${parsed.data.nombre_instrumento},
              numero_parte = ${parsed.data.numero_parte},
              numero_serie = ${parsed.data.numero_serie},
              foto_url = ${fotoUrl}
          WHERE id = ${id}
          RETURNING id, persona_carga, nombre_instrumento, numero_parte, numero_serie, foto_url, fecha_carga
        `;

    if (uploadedUrl && existing.foto_url && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(existing.foto_url);
      } catch (error) {
        console.error("No se pudo eliminar la fotografía anterior:", error);
      }
    }
    return NextResponse.json(instrumento);
  } catch (error) {
    console.error("Error al actualizar instrumento:", error);
    if (uploadedUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(uploadedUrl);
      } catch (cleanupError) {
        console.error("No se pudo limpiar la fotografía tras fallar la edición:", cleanupError);
      }
    }
    return errorResponse("No se pudo actualizar el instrumento. Revisa la conexión a la base de datos y el almacenamiento de fotos.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const id = await getId(context);
  if (id === null) {
    return errorResponse("El identificador del instrumento no es válido.", 400);
  }

  try {
    await ensureDatabase();
    const [instrumento] = await getSql()`
      DELETE FROM instrumentos
      WHERE id = ${id}
      RETURNING id, foto_url
    `;
    if (!instrumento) {
      return errorResponse("No se encontró el instrumento solicitado.", 404);
    }

    if (instrumento.foto_url && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(instrumento.foto_url);
      } catch (error) {
        console.error("No se pudo eliminar la fotografía asociada:", error);
      }
    }
    return NextResponse.json({ message: "Instrumento eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar instrumento:", error);
    return errorResponse("No se pudo eliminar el instrumento.", 500);
  }
}

import { z } from "zod";

export const instrumentoSchema = z.object({
  persona_carga: z.string().trim().min(1, "Ingresa el nombre de quien carga el instrumento.").max(160, "El nombre no puede superar 160 caracteres."),
  nombre_instrumento: z.string().trim().min(1, "Ingresa el nombre del instrumento.").max(200, "El nombre no puede superar 200 caracteres."),
  numero_parte: z.string().trim().min(1, "Ingresa el número de parte.").max(120, "El número de parte no puede superar 120 caracteres."),
  numero_serie: z.string().trim().min(1, "Ingresa el número de serie.").max(120, "El número de serie no puede superar 120 caracteres."),
});

export type InstrumentoInput = z.infer<typeof instrumentoSchema>;

export type Instrumento = InstrumentoInput & {
  id: number;
  foto_url: string | null;
  fecha_carga: string;
};

export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

const imageSignatures: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) =>
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  "image/gif": (bytes) =>
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61,
  "image/webp": (bytes) =>
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50,
};

export async function validateImage(file: File): Promise<string | null> {
  if (file.size > MAX_IMAGE_SIZE) {
    return "La imagen no puede superar los 4 MB.";
  }

  const signature = imageSignatures[file.type];
  if (!signature) {
    return "El archivo debe ser una imagen JPEG, PNG, GIF o WebP.";
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!signature(bytes)) {
    return "El contenido del archivo no coincide con un formato de imagen válido.";
  }

  return null;
}

export function parseInstrumentoId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

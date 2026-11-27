let shareInFlight = false;

export function safePdfFilename(value = "VJH_Ficha.pdf") {
  const name = String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const clean = name.replace(/^\.+/, "") || "VJH_Ficha.pdf";
  return clean.toLowerCase().endsWith(".pdf") ? clean : `${clean}.pdf`;
}

export async function prepareProductPdf({ endpoint, filename = "VJH_Ficha.pdf", signal, maxBytes = 1572864, request = window.fetch, headers = {} }) {
  const url = new URL(endpoint, window.location.href);
  if (url.origin !== window.location.origin || url.username || url.password) throw new Error("El PDF debe solicitarse al mismo origen de VJH.");
  const response = await request(url.href, { method: "GET", credentials: "same-origin", signal, headers: { Accept: "application/pdf", ...headers }, cache: "no-cache" });
  if (!response.ok) { const message = response.status === 409 ? "Hay códigos de referido distintos en el enlace y en tu sesión. No se generó ninguna ficha." : response.status === 400 ? "El código de referido del enlace no es válido." : "No se pudo preparar la ficha. Inténtalo de nuevo."; const error = new Error(message); error.status = response.status; throw error; }
  if (!/^application\/pdf(?:;|$)/i.test(response.headers.get("content-type") || "")) throw new Error("El servidor no devolvió un PDF válido.");
  const declared = Number(response.headers.get("content-length"));
  if (declared > maxBytes) throw new Error("La ficha supera el tamaño permitido.");
  const blob = await response.blob();
  if (!blob.size || blob.size > maxBytes) throw new Error("La ficha está vacía o supera el tamaño permitido.");
  if (await blob.slice(0, 5).text() !== "%PDF-") throw new Error("El archivo recibido no es un PDF.");
  return new File([blob], safePdfFilename(filename), { type: "application/pdf" });
}

export function canSharePreparedPdf(file) {
  try { return typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }); } catch { return false; }
}

export async function sharePreparedPdf(file, title = "Ficha de producto VJH") {
  if (!canSharePreparedPdf(file)) return { status: "download-required" };
  if (shareInFlight) return { status: "in-progress" };
  shareInFlight = true;
  try { await navigator.share({ files: [file], title }); return { status: "handed-off" }; }
  catch (error) { if (error?.name === "AbortError") return { status: "dismissed" }; return { status: "download-required", reason: error?.name || "ShareError" }; }
  finally { shareInFlight = false; }
}

export function downloadPreparedPdf(file) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = safePdfFilename(file.name); anchor.rel = "noopener";
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

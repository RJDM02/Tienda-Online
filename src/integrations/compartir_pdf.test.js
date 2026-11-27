import { safePdfFilename, prepareProductPdf, sharePreparedPdf } from "./compartir_pdf";

describe("ficha PDF VJH", () => {
  test("normaliza un nombre seguro", () => {
    expect(safePdfFilename("Ficha Seagate 6 TB")).toBe("Ficha_Seagate_6_TB.pdf");
  });

  test("rechaza respuestas que no sean PDF", async () => {
    const request = jest.fn().mockResolvedValue(new Response("texto", {
      status: 200, headers: { "content-type": "text/plain" },
    }));
    await expect(prepareProductPdf({ endpoint: "/api/products/270/sheet.pdf", request }))
      .rejects.toThrow("PDF válido");
  });

  test("explica el conflicto de referidos sin elegir uno", async () => {
    const request = jest.fn().mockResolvedValue({ ok: false, status: 409, headers: { get: () => "application/json" } });
    await expect(prepareProductPdf({ endpoint: "/api/products/270/sheet.pdf", request }))
      .rejects.toThrow("referido distintos");
  });

  test("bloquea una segunda compartición mientras el selector está abierto", async () => {
    const oldShare = navigator.share; const oldCanShare = navigator.canShare;
    let release;
    Object.defineProperty(navigator, "share", { configurable: true, value: jest.fn(() => new Promise(resolve => { release = resolve; })) });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: jest.fn().mockReturnValue(true) });
    const file = new File(["%PDF-1.4"], "Disco_Interno_Seagate_V5_HDD_6TB.pdf", { type: "application/pdf" });
    const first = sharePreparedPdf(file);
    await expect(sharePreparedPdf(file)).resolves.toEqual({ status: "in-progress" });
    expect(navigator.share).toHaveBeenCalledTimes(1);
    release();
    await expect(first).resolves.toEqual({ status: "handed-off" });
    Object.defineProperty(navigator, "share", { configurable: true, value: oldShare });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: oldCanShare });
  });

  test("cancelar Web Share no fuerza descarga", async () => {
    const oldShare = navigator.share; const oldCanShare = navigator.canShare;
    Object.defineProperty(navigator, "share", { configurable: true, value: jest.fn().mockRejectedValue(Object.assign(new Error(), { name: "AbortError" })) });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: jest.fn().mockReturnValue(true) });
    const result = await sharePreparedPdf(new File(["%PDF-1.4"], "ficha.pdf", { type: "application/pdf" }));
    expect(result).toEqual({ status: "dismissed" });
    Object.defineProperty(navigator, "share", { configurable: true, value: oldShare });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: oldCanShare });
  });
});

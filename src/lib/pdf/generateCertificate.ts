import { PDFDocument, PDFFont, PDFPage, rgb, degrees, LineCapStyle } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export type CertificatePdfInput = {
  participantName: string;
  trainingTitle: string;
  organizer: string;
  trainer: string;
  location: string | null;
  startDate: string; // ISO
  endDate: string; // ISO
  certificateNumber: string;
  verificationUrl: string;
  organizerLogoUrl?: string | null;
  trainerSignatureUrl?: string | null;
  /** Couleur d'accent hexadécimale propre à la formation (ex: "#2557eb"). */
  accentColor?: string | null;
};

type RGB = [number, number, number];

// ------------------------------------------------------------------
// Couleurs
// ------------------------------------------------------------------

function hexToRgb01(hex: string): RGB {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = parseInt(full, 16);
  if (Number.isNaN(int)) return [0.145, 0.34, 0.92];
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const WHITE: RGB = [1, 1, 1];
const BLACK: RGB = [0, 0, 0];

function darken(c: RGB, amount: number): RGB {
  return mix(c, BLACK, amount);
}
function lighten(c: RGB, amount: number): RGB {
  return mix(c, WHITE, amount);
}
function toColor(c: RGB) {
  return rgb(c[0], c[1], c[2]);
}

// ------------------------------------------------------------------
// Typographie avec tracking (letter-spacing) — pdf-lib ne le
// supporte pas nativement, on le simule caractère par caractère.
// ------------------------------------------------------------------

function trackedWidth(text: string, font: PDFFont, size: number, tracking: number): number {
  let w = 0;
  for (const ch of text) w += font.widthOfTextAtSize(ch, size);
  return w + tracking * Math.max(0, text.length - 1);
}

function drawTracked(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color: ReturnType<typeof rgb>; tracking: number; opacity?: number }
) {
  let cursor = x;
  for (const ch of text) {
    page.drawText(ch, {
      x: cursor,
      y,
      size: opts.size,
      font: opts.font,
      color: opts.color,
      opacity: opts.opacity ?? 1,
    });
    cursor += opts.font.widthOfTextAtSize(ch, opts.size) + opts.tracking;
  }
}

function centerTracked(
  page: PDFPage,
  text: string,
  centerX: number,
  y: number,
  opts: { font: PDFFont; size: number; color: ReturnType<typeof rgb>; tracking: number; opacity?: number }
): number {
  const w = trackedWidth(text, opts.font, opts.size, opts.tracking);
  drawTracked(page, text, centerX - w / 2, y, opts);
  return w;
}

function drawCentered(
  page: PDFPage,
  text: string,
  centerX: number,
  y: number,
  opts: { font: PDFFont; size: number; color: ReturnType<typeof rgb>; opacity?: number }
): number {
  const w = opts.font.widthOfTextAtSize(text, opts.size);
  page.drawText(text, { x: centerX - w / 2, y, size: opts.size, font: opts.font, color: opts.color, opacity: opts.opacity ?? 1 });
  return w;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number, maxLines = 2): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) {
        // Dernière ligne autorisée : on y case le reste, tronqué si besoin.
        const remaining = [word, ...words.slice(words.indexOf(word) + 1)].join(" ");
        let last = remaining;
        while (font.widthOfTextAtSize(last + "…", size) > maxWidth && last.length > 1) {
          last = last.slice(0, -1);
        }
        lines.push(remaining === last ? last : `${last.trim()}…`);
        return lines;
      }
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

// ------------------------------------------------------------------
// Formes décoratives
// ------------------------------------------------------------------

function drawVerticalGradient(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  colorTop: RGB,
  colorBottom: RGB,
  steps = 48
) {
  const stepH = h / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const c = mix(colorTop, colorBottom, t);
    page.drawRectangle({
      x,
      y: y + h - (i + 1) * stepH,
      width: w,
      height: stepH + 0.6,
      color: toColor(c),
    });
  }
}

/** Bandeau supérieur en biais (diagonal cut) donnant un effet dynamique. */
function drawDiagonalBand(
  page: PDFPage,
  originX: number,
  originY: number,
  bandWidth: number,
  heightLeft: number,
  heightRight: number,
  color: RGB
) {
  const p = `M0 0 L${bandWidth} 0 L${bandWidth} ${heightRight} L0 ${heightLeft} Z`;
  page.drawSvgPath(p, { x: originX, y: originY, color: toColor(color) });
}

/** Fines lignes diagonales parallèles suggérant du mouvement/dynamisme. */
function drawMotionLines(
  page: PDFPage,
  cx: number,
  cy: number,
  count: number,
  length: number,
  spacing: number,
  angleDeg: number,
  color: RGB,
  baseOpacity: number
) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const nx = -dy;
  const ny = dx;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spacing;
    const startX = cx + nx * offset - (dx * length) / 2;
    const startY = cy + ny * offset - (dy * length) / 2;
    const endX = cx + nx * offset + (dx * length) / 2;
    const endY = cy + ny * offset + (dy * length) / 2;
    const opacity = baseOpacity * (1 - Math.abs(i - (count - 1) / 2) / count);
    page.drawLine({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      thickness: 1.4,
      color: toColor(color),
      opacity,
    });
  }
}

/** Sceau circulaire "certifié" avec anneau, coche et rubans. */
function drawSeal(page: PDFPage, cx: number, cy: number, radius: number, accent: RGB, accentDark: RGB) {
  // Rubans (derrière le cercle)
  const ribbonColor = darken(accent, 0.15);
  page.drawSvgPath(`M0 0 L18 0 L9 30 L0 20 Z`, {
    x: cx - 15,
    y: cy - radius + 6,
    color: toColor(ribbonColor),
  });
  page.drawSvgPath(`M0 0 L18 0 L18 20 L9 30 Z`, {
    x: cx + 2,
    y: cy - radius + 6,
    color: toColor(darken(accent, 0.3)),
  });

  // Anneau extérieur (petites perles autour, effet "rosette")
  const beadCount = 22;
  for (let i = 0; i < beadCount; i++) {
    const a = (i / beadCount) * Math.PI * 2;
    page.drawEllipse({
      x: cx + Math.cos(a) * (radius + 4),
      y: cy + Math.sin(a) * (radius + 4),
      xScale: 2.1,
      yScale: 2.1,
      color: toColor(accent),
      opacity: 0.55,
    });
  }

  // Disque principal
  page.drawEllipse({ x: cx, y: cy, xScale: radius, yScale: radius, color: toColor(accent) });
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: radius - 5,
    yScale: radius - 5,
    borderColor: toColor(WHITE),
    borderWidth: 1.2,
    color: toColor(accent),
  });
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: radius - 9,
    yScale: radius - 9,
    color: toColor(accentDark),
  });

  // Coche (check)
  page.drawSvgPath(`M0 6 L6 12 L18 -6`, {
    x: cx - 9,
    y: cy + 5,
    borderColor: toColor(WHITE),
    borderWidth: 2.6,
    borderLineCap: LineCapStyle.Round,
  });
}

/** Boîte à coins accentués (style "cadre de scan") pour le QR code. */
function drawCornerFrame(page: PDFPage, x: number, y: number, w: number, h: number, len: number, color: RGB, thickness = 1.6) {
  const corners: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + len * sx, y: cy },
      thickness,
      color: toColor(color),
    });
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx, y: cy + len * sy },
      thickness,
      color: toColor(color),
    });
  }
}

// ------------------------------------------------------------------
// Utilitaires image / date
// ------------------------------------------------------------------

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedImageAuto(pdfDoc: PDFDocument, bytes: Uint8Array, hintUrl: string) {
  const isPng = hintUrl.toLowerCase().includes(".png");
  try {
    return isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  } catch {
    try {
      return await pdfDoc.embedPng(bytes);
    } catch {
      return await pdfDoc.embedJpg(bytes);
    }
  }
}

function formatFr(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function loadFont(name: string): Uint8Array {
  const candidates = [
    path.resolve(process.cwd(), "src", "lib", "pdf", "fonts", name),
    path.resolve(__dirname, "fonts", name),
    path.resolve(process.cwd(), "app", "lib", "pdf", "fonts", name),
  ];

  const fontPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!fontPath) {
    throw new Error(`Police introuvable: ${name}`);
  }

  return fs.readFileSync(fontPath);
}

// ------------------------------------------------------------------
// Génération principale
// ------------------------------------------------------------------

export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  pdfDoc.setTitle(`Attestation — ${input.participantName}`);
  pdfDoc.setProducer("TUVA");
  pdfDoc.setCreator("TUVA");

  const page = pdfDoc.addPage([842, 595]); // A4 paysage
  const { width, height } = page.getSize();

  const [fontRegular, fontMedium, fontSemiBold, fontBold] = await Promise.all([
    pdfDoc.embedFont(loadFont("Poppins-Regular.ttf"), { subset: true }),
    pdfDoc.embedFont(loadFont("Poppins-Medium.ttf"), { subset: true }),
    pdfDoc.embedFont(loadFont("Poppins-SemiBold.ttf"), { subset: true }),
    pdfDoc.embedFont(loadFont("Poppins-Bold.ttf"), { subset: true }),
  ]);

  // ---- Palette dérivée de la couleur d'accent de la formation ----
  const accent = hexToRgb01(input.accentColor || "#2557eb");
  const accentDark = darken(accent, 0.32);
  const accentDeep = darken(accent, 0.5);
  const accentTint = lighten(accent, 0.9);
  const ink = mix(darken(accent, 0.75), [0.06, 0.07, 0.09], 0.5);
  const slate: RGB = [0.42, 0.45, 0.51];
  const paper: RGB = [0.99, 0.99, 0.995];
  const hairline: RGB = [0.87, 0.88, 0.92];

  // ---- Fond ----
  page.drawRectangle({ x: 0, y: 0, width, height, color: toColor(paper) });

  // Cercles décoratifs (arrière-plan, sous le contenu)
  page.drawEllipse({ x: -40, y: -30, xScale: 190, yScale: 190, color: toColor(accentTint), opacity: 0.6 });
  page.drawEllipse({ x: 40, y: 60, xScale: 70, yScale: 70, color: toColor(accentTint), opacity: 0.45 });
  page.drawEllipse({ x: width - 30, y: 40, xScale: 130, yScale: 130, color: toColor(accentTint), opacity: 0.35 });

  // Filigrane discret
  page.drawText("TUVA", {
    x: width / 2 - 155,
    y: height / 2 - 60,
    size: 150,
    font: fontBold,
    color: toColor(mix(accent, WHITE, 0.85)),
    opacity: 0.22,
    rotate: degrees(14),
  });

  // ---- Barre verticale gauche (dégradé) ----
  drawVerticalGradient(page, 0, 0, 9, height, accent, accentDeep);

  // ---- Bandeau supérieur en biais ----
  const bandLeftX = 9;
  const bandWidth = width - bandLeftX;
  const bandHeightLeft = 146;
  const bandHeightRight = 104;
  drawDiagonalBand(page, bandLeftX, height, bandWidth, bandHeightLeft, bandHeightRight, accent);
  // Liseré d'ombre le long du bord incliné (effet de profondeur)
  page.drawLine({
    start: { x: bandLeftX, y: height - bandHeightLeft },
    end: { x: width, y: height - bandHeightRight },
    thickness: 2.5,
    color: toColor(accentDark),
    opacity: 0.55,
  });

  // Lignes de mouvement dans le coin supérieur droit du bandeau
  drawMotionLines(page, width - 150, height - 42, 5, 60, 9, -24, WHITE, 0.3);

  // ---- Logo / monogramme ----
  let headerTextX = 46;
  const bandMidY = height - (bandHeightLeft + bandHeightRight) / 4 - 18;
  if (input.organizerLogoUrl) {
    const bytes = await fetchImageBytes(input.organizerLogoUrl);
    if (bytes) {
      try {
        const img = await embedImageAuto(pdfDoc, bytes, input.organizerLogoUrl);
        const maxH = 50;
        const scale = maxH / img.height;
        const w = img.width * scale;
        page.drawImage(img, { x: 46, y: height - 40 - maxH, width: w, height: maxH });
        headerTextX = 46 + w + 24;
      } catch {
        // ignore
      }
    }
  }
  if (headerTextX === 46) {
    // Pas de logo : monogramme TUVA dans un badge blanc
    page.drawEllipse({ x: 46 + 22, y: height - 66, xScale: 22, yScale: 22, color: toColor(WHITE), opacity: 0.95 });
    drawCentered(page, "TV", 46 + 22, height - 72, { font: fontBold, size: 16, color: toColor(accent) });
    headerTextX = 46 + 56;
  }

  drawTracked(page, "ATTESTATION DE PARTICIPATION", headerTextX, height - 52, {
    font: fontBold,
    size: 19,
    color: toColor(WHITE),
    tracking: 1.4,
  });
  page.drawText("Délivrée et vérifiable en ligne via TUVA", {
    x: headerTextX,
    y: height - 72,
    size: 10.5,
    font: fontMedium,
    color: toColor(mix(accent, WHITE, 0.85)),
    opacity: 0.95,
  });

  // ---- Corps du certificat ----
  let y = height - bandHeightLeft - 46;

  centerTracked(page, "CECI CERTIFIE QUE", width / 2, y, {
    font: fontSemiBold,
    size: 10.5,
    color: toColor(accentDark),
    tracking: 2.6,
  });

  y -= 46;
  const nameSize = input.participantName.length > 28 ? 26 : 32;
  const nameWidth = fontBold.widthOfTextAtSize(input.participantName, nameSize);
  drawCentered(page, input.participantName, width / 2, y, { font: fontBold, size: nameSize, color: toColor(ink) });

  // Soulignement : trait fin pleine largeur + segment accent plus épais au centre
  page.drawLine({
    start: { x: width / 2 - nameWidth / 2 - 26, y: y - 12 },
    end: { x: width / 2 + nameWidth / 2 + 26, y: y - 12 },
    thickness: 0.75,
    color: toColor(hairline),
  });
  page.drawLine({
    start: { x: width / 2 - 34, y: y - 12 },
    end: { x: width / 2 + 34, y: y - 12 },
    thickness: 3,
    color: toColor(accent),
  });
  page.drawEllipse({ x: width / 2 - 34, y: y - 12, xScale: 2.6, yScale: 2.6, color: toColor(accent) });
  page.drawEllipse({ x: width / 2 + 34, y: y - 12, xScale: 2.6, yScale: 2.6, color: toColor(accent) });

  y -= 42;
  drawCentered(page, "a participé avec succès à la formation", width / 2, y, {
    font: fontRegular,
    size: 12.5,
    color: toColor(slate),
  });

  y -= 32;
  const titleLines = wrapText(input.trainingTitle, fontSemiBold, 20, width - 260, 2);
  for (const line of titleLines) {
    drawCentered(page, line, width / 2, y, { font: fontSemiBold, size: 20, color: toColor(accentDark) });
    y -= 26;
  }

  y -= 4;
  const dateRange =
    input.startDate === input.endDate
      ? formatFr(input.startDate)
      : `du ${formatFr(input.startDate)} au ${formatFr(input.endDate)}`;
  const metaText = input.location ? `${dateRange}   •   ${input.location}` : dateRange;
  drawCentered(page, metaText, width / 2, y, { font: fontMedium, size: 11.5, color: toColor(slate) });

  y -= 22;
  // "Organisé par <organizer>" avec organizer en semi-gras
  const partA = "Organisé par ";
  const partB = input.organizer;
  const wA = fontRegular.widthOfTextAtSize(partA, 11.5);
  const wB = fontSemiBold.widthOfTextAtSize(partB, 11.5);
  const startX = width / 2 - (wA + wB) / 2;
  page.drawText(partA, { x: startX, y, size: 11.5, font: fontRegular, color: toColor(slate) });
  page.drawText(partB, { x: startX + wA, y, size: 11.5, font: fontSemiBold, color: toColor(ink) });

  // ---- Pied de page ----
  const footY = 96;
  const footLineY = footY + 34;

  // Colonne gauche : signature
  const sigX = 78;
  if (input.trainerSignatureUrl) {
    const bytes = await fetchImageBytes(input.trainerSignatureUrl);
    if (bytes) {
      try {
        const img = await embedImageAuto(pdfDoc, bytes, input.trainerSignatureUrl);
        const maxW = 120;
        const scale = maxW / img.width;
        const h = Math.min(img.height * scale, 46);
        page.drawImage(img, { x: sigX, y: footLineY + 6, width: maxW, height: h });
      } catch {
        // ignore
      }
    }
  }
  page.drawLine({ start: { x: sigX, y: footLineY }, end: { x: sigX + 170, y: footLineY }, thickness: 1, color: toColor(hairline) });
  page.drawText(input.trainer, { x: sigX, y: footLineY - 16, size: 12, font: fontSemiBold, color: toColor(ink) });
  drawTracked(page, "FORMATEUR", sigX, footLineY - 29, { font: fontMedium, size: 8, color: toColor(slate), tracking: 1.4 });

  // Colonne centrale : sceau + numéro d'attestation
  const centerX = width / 2;
  const sealCy = footY + 58;
  drawSeal(page, centerX, sealCy, 25, accent, accentDeep);
  drawCentered(page, input.certificateNumber, centerX, footY - 8, { font: fontBold, size: 12.5, color: toColor(accentDark) });
  centerTracked(page, "N° D'ATTESTATION", centerX, footY - 21, {
    font: fontMedium,
    size: 7.5,
    color: toColor(slate),
    tracking: 1.2,
  });

  // Colonne droite : QR code
  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    margin: 0,
    width: 240,
    color: { dark: `#${Math.round(accentDeep[0] * 255).toString(16).padStart(2, "0")}${Math.round(accentDeep[1] * 255).toString(16).padStart(2, "0")}${Math.round(accentDeep[2] * 255).toString(16).padStart(2, "0")}`, light: "#00000000" },
  });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await pdfDoc.embedPng(qrBytes);
  const qrSize = 62;
  const qrX = width - 130 - qrSize / 2;
  const qrY = footLineY - 4;
  drawCornerFrame(page, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10, accent);
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  const qrCenterX = qrX + qrSize / 2;
  drawTracked(page, "VÉRIFIER L'AUTHENTICITÉ", qrCenterX, qrY - 20, {
    font: fontMedium,
    size: 7,
    color: toColor(slate),
    tracking: 0.8,
  });

  // ---- Bas de page : trait de clôture + mention légale ----
  page.drawLine({ start: { x: 46, y: 40 }, end: { x: width - 46, y: 40 }, thickness: 2, color: toColor(accent) });
  drawCentered(page, "Document généré électroniquement par TUVA — authenticité vérifiable via le QR code ci-dessus", width / 2, 26, {
    font: fontRegular,
    size: 7.5,
    color: toColor(slate),
    opacity: 0.85,
  });

  return pdfDoc.save();
}

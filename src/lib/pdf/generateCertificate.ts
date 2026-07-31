import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import QRCode from "qrcode";

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
};

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function formatFr(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Génère un certificat PDF professionnel A4 paysage et retourne
 * les bytes du fichier (Uint8Array), prêts à être uploadés dans
 * Supabase Storage ou renvoyés directement en téléchargement.
 */
export async function generateCertificatePdf(
  input: CertificatePdfInput
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 paysage (points)
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const brandBlue = rgb(0.145, 0.29, 0.596); // #2557eb-ish
  const darkGray = rgb(0.13, 0.15, 0.19);
  const midGray = rgb(0.4, 0.43, 0.48);
  const lightBorder = rgb(0.85, 0.87, 0.92);

  // ---- Cadre décoratif ----
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: brandBlue,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: lightBorder,
    borderWidth: 1,
  });

  // Bandeau supérieur
  page.drawRectangle({
    x: 20,
    y: height - 20 - 90,
    width: width - 40,
    height: 90,
    color: brandBlue,
  });

  // ---- Logo organisateur (si fourni) ----
  let logoDrawn = false;
  if (input.organizerLogoUrl) {
    const logoBytes = await fetchImageBytes(input.organizerLogoUrl);
    if (logoBytes) {
      try {
        const isPng = input.organizerLogoUrl.toLowerCase().includes(".png");
        const logoImage = isPng
          ? await pdfDoc.embedPng(logoBytes)
          : await pdfDoc.embedJpg(logoBytes);
        const logoDims = logoImage.scale(1);
        const maxH = 55;
        const scale = maxH / logoDims.height;
        const w = logoDims.width * scale;
        page.drawImage(logoImage, {
          x: 45,
          y: height - 20 - 90 + (90 - maxH) / 2,
          width: w,
          height: maxH,
        });
        logoDrawn = true;
      } catch {
        logoDrawn = false;
      }
    }
  }

  // Titre TUVA dans le bandeau
  page.drawText("ATTESTATION DE PARTICIPATION", {
    x: logoDrawn ? 200 : 45,
    y: height - 20 - 55,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Délivrée par TUVA", {
    x: logoDrawn ? 200 : 45,
    y: height - 20 - 75,
    size: 10,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  let y = height - 160;

  // "Ceci certifie que"
  page.drawText("Nous certifions que", {
    x: width / 2 - fontRegular.widthOfTextAtSize("Nous certifions que", 13) / 2,
    y,
    size: 13,
    font: fontRegular,
    color: midGray,
  });

  y -= 45;
  const nameSize = 30;
  const nameWidth = fontBold.widthOfTextAtSize(input.participantName, nameSize);
  page.drawText(input.participantName, {
    x: width / 2 - nameWidth / 2,
    y,
    size: nameSize,
    font: fontBold,
    color: darkGray,
  });
  // Soulignement
  page.drawLine({
    start: { x: width / 2 - nameWidth / 2 - 10, y: y - 8 },
    end: { x: width / 2 + nameWidth / 2 + 10, y: y - 8 },
    thickness: 1.5,
    color: brandBlue,
  });

  y -= 45;
  const participationText = "a participé avec succès à la formation :";
  page.drawText(participationText, {
    x: width / 2 - fontRegular.widthOfTextAtSize(participationText, 13) / 2,
    y,
    size: 13,
    font: fontRegular,
    color: midGray,
  });

  y -= 38;
  const titleSize = 19;
  const titleWidth = fontBold.widthOfTextAtSize(input.trainingTitle, titleSize);
  page.drawText(input.trainingTitle, {
    x: width / 2 - titleWidth / 2,
    y,
    size: titleSize,
    font: fontBold,
    color: brandBlue,
  });

  y -= 30;
  const dateRange =
    input.startDate === input.endDate
      ? formatFr(input.startDate)
      : `du ${formatFr(input.startDate)} au ${formatFr(input.endDate)}`;
  const metaLine = input.location
    ? `${dateRange} — ${input.location}`
    : dateRange;
  page.drawText(metaLine, {
    x: width / 2 - fontRegular.widthOfTextAtSize(metaLine, 12) / 2,
    y,
    size: 12,
    font: fontItalic,
    color: midGray,
  });

  y -= 25;
  const orgLine = `Organisé par ${input.organizer}`;
  page.drawText(orgLine, {
    x: width / 2 - fontRegular.widthOfTextAtSize(orgLine, 12) / 2,
    y,
    size: 12,
    font: fontRegular,
    color: midGray,
  });

  // ---- Zone signature (bas gauche) ----
  const bottomY = 95;
  if (input.trainerSignatureUrl) {
    const sigBytes = await fetchImageBytes(input.trainerSignatureUrl);
    if (sigBytes) {
      try {
        const isPng = input.trainerSignatureUrl.toLowerCase().includes(".png");
        const sigImage = isPng
          ? await pdfDoc.embedPng(sigBytes)
          : await pdfDoc.embedJpg(sigBytes);
        const dims = sigImage.scale(1);
        const maxW = 130;
        const scale = maxW / dims.width;
        page.drawImage(sigImage, {
          x: 90,
          y: bottomY + 35,
          width: maxW,
          height: dims.height * scale,
        });
      } catch {
        // ignore silently
      }
    }
  }
  page.drawLine({
    start: { x: 90, y: bottomY + 30 },
    end: { x: 260, y: bottomY + 30 },
    thickness: 1,
    color: lightBorder,
  });
  page.drawText(input.trainer, {
    x: 90,
    y: bottomY + 15,
    size: 11,
    font: fontBold,
    color: darkGray,
  });
  page.drawText("Formateur", {
    x: 90,
    y: bottomY,
    size: 9,
    font: fontRegular,
    color: midGray,
  });

  // ---- Numéro d'attestation (bas centre) ----
  page.drawText(`N° ${input.certificateNumber}`, {
    x: width / 2 - fontBold.widthOfTextAtSize(`N° ${input.certificateNumber}`, 11) / 2,
    y: bottomY,
    size: 11,
    font: fontBold,
    color: brandBlue,
  });
  page.drawText("Numéro d'attestation", {
    x:
      width / 2 -
      fontRegular.widthOfTextAtSize("Numéro d'attestation", 8) / 2,
    y: bottomY - 12,
    size: 8,
    font: fontRegular,
    color: midGray,
  });

  // ---- QR Code (bas droite) ----
  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    margin: 0,
    width: 200,
  });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  const qrSize = 75;
  page.drawImage(qrImage, {
    x: width - 90 - qrSize + qrSize / 2 - qrSize / 2,
    y: bottomY,
    width: qrSize,
    height: qrSize,
  });
  page.drawText("Scanner pour vérifier", {
    x:
      width -
      90 -
      qrSize / 2 -
      fontRegular.widthOfTextAtSize("Scanner pour vérifier", 8) / 2 +
      qrSize / 2,
    y: bottomY - 12,
    size: 8,
    font: fontRegular,
    color: midGray,
  });

  // Filigrane discret
  page.drawText("TUVA", {
    x: width / 2 - 60,
    y: height / 2 - 20,
    size: 90,
    font: fontBold,
    color: rgb(0.95, 0.96, 0.98),
    rotate: degrees(20),
    opacity: 0.5,
  });

  return pdfDoc.save();
}

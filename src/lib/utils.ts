import { customAlphabet } from "nanoid";
import { clsx, type ClassValue } from "clsx";

// Alphabet sans caractères ambigus (0/O, 1/I) pour faciliter la
// lecture/saisie manuelle du code par les participants.
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const nano = customAlphabet(alphabet, 6);

/** Génère un numéro d'attestation unique, ex: TUVA-7KX92A */
export function generateCertificateNumber(): string {
  return `TUVA-${nano()}`;
}

/** Génère un code de vérification distinct (utilisé dans l'URL /verify/[code]) */
export function generateVerificationCode(): string {
  const nanoLong = customAlphabet(alphabet, 10);
  return nanoLong();
}

export function generateRegistrationToken(): string {
  const nanoLong = customAlphabet(alphabet, 24);
  return nanoLong();
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRange(start: string, end: string): string {
  const s = formatDate(start);
  const e = formatDate(end);
  return s === e ? s : `${s} au ${e}`;
}

/** Nettoie et normalise un nom pour comparaison insensible à la casse/accents */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

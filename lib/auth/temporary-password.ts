import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** A one-time password: at least one letter and one digit, never stored. */
export function temporaryPassword(): string {
  const bytes = randomBytes(14);
  let body = "";
  for (const byte of bytes) body += ALPHABET[byte % ALPHABET.length];
  return `A${body}7`;
}

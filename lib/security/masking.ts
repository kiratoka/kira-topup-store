// lib/security/masking.ts

/**
 * Menyamarkan alamat email untuk melindungi privasi pelanggan (contoh: "user@example.com" -> "u***@example.com").
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) {
    return trimmed;
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex); // termasuk karakter '@'

  const firstChar = localPart[0];
  return `${firstChar}***${domainPart}`;
}

/**
 * Menyaring data invoice untuk respons publik:
 * 1. Menyamarkan email pelanggan (PII protection)
 * 2. Menghilangkan token pembayaran Snap jika transaksi sudah tidak berstatus 'pending'
 */
export function sanitizeInvoice<T extends {
  status: string;
  token?: string | null;
  customer?: unknown;
}>(invoice: T): T {
  const isPending = invoice.status === 'pending';

  let sanitizedCustomer = invoice.customer;
  if (invoice.customer && typeof invoice.customer === 'object') {
    const cust = invoice.customer as Record<string, unknown>;
    sanitizedCustomer = {
      ...cust,
      email: typeof cust.email === 'string' ? maskEmail(cust.email) : cust.email,
    };
  }

  return {
    ...invoice,
    token: isPending ? invoice.token : null,
    customer: sanitizedCustomer,
  };
}

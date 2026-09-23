import { z } from "zod";

export const paymentCustomerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .max(100, "Format email maksimal 100 karakter"),
  userId: z
    .string()
    .trim()
    .min(1, "User ID wajib diisi")
    .max(50, "User ID maksimal 50 karakter"),
  serverId: z
    .string()
    .trim()
    .max(50, "Server ID maksimal 50 karakter")
    .optional(),
  gameId: z
    .string()
    .trim()
    .min(1, "Game ID wajib diisi")
    .max(100, "Game ID maksimal 100 karakter"),
});

export const paymentRequestSchema = z
  .object({
    customer: paymentCustomerSchema,
    productId: z
      .string()
      .trim()
      .min(1, "Product ID wajib diisi")
      .max(100, "Product ID maksimal 100 karakter")
      .optional(),
    // Backward compatibility with legacy client payload format
    product: z
      .object({
        id: z
          .string()
          .trim()
          .min(1, "Product ID wajib diisi")
          .max(100, "Product ID maksimal 100 karakter"),
        price: z.number().optional(),
        name: z.string().optional(),
        currency: z.unknown().optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.productId || data.product?.id), {
    message: "Product ID wajib diisi",
    path: ["productId"],
  });

export type PaymentCustomerInput = z.infer<typeof paymentCustomerSchema>;
export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;

/**
 * Format Zod validation errors into a key-value map for client consumption
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!formatted[key]) {
      formatted[key] = issue.message;
    }
  }
  return formatted;
}

import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date");

export const contractExtractionSchema = z.object({
  vendorName: z.string().min(1),
  value: z.coerce.number().nonnegative(),
  startDate: isoDate,
  endDate: isoDate,
  paymentTerms: z.string().min(1),
  category: z.string().min(1),
});

export const saveContractSchema = z
  .object({
    vendorId: z.string().uuid().optional(),
    vendorName: z.string().min(1).optional(),
    value: z.coerce.number().nonnegative(),
    startDate: isoDate,
    endDate: isoDate,
    paymentTerms: z.string().min(1),
    category: z.string().min(1),
    vendorRating: z.coerce.number().min(0).max(5).default(4),
  })
  .refine((value) => value.vendorId || value.vendorName, {
    message: "Either vendorId or vendorName is required.",
    path: ["vendorName"],
  });

export const chatQuerySchema = z.object({
  userId: z.string().min(1).default("demo-user"),
  query: z.string().min(1).max(500),
});

export const supplierCompareSchema = z.object({
  vendorIds: z.array(z.string().uuid()).min(2).max(3),
});

export type ContractExtractionInput = z.infer<typeof contractExtractionSchema>;
export type SaveContractInput = z.infer<typeof saveContractSchema>;
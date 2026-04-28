import z from "zod"

export function verifyPrimitiveMetadata(target: any) {
  return z.object({
    data: z.record(z.string(), z.array(z.string())),
    focusTabs: z.object({
      currentId: z.string(),
      tabs: z.array(z.object({
        id: z.string(),
        name: z.string(),
        sources: z.array(z.string()),
      })),
    }).optional(),
    autoRefresh: z.object({
      enabledSources: z.array(z.string()),
    }).optional(),
    updatedTime: z.number(),
  }).parse(target)
}

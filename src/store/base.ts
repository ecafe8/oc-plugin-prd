import type { ZodSchema } from "zod";

import { readYaml, writeYaml } from "@/utils/fs";

export async function readValidatedYaml<T>(filePath: string, schema: ZodSchema<T>, fallback: T): Promise<T> {
  const data = await readYaml<unknown>(filePath);
  if (!data) {
    return fallback;
  }

  return schema.parse(data);
}

export async function writeValidatedYaml<T>(filePath: string, schema: ZodSchema<T>, value: T): Promise<void> {
  const parsed = schema.parse(value);
  await writeYaml(filePath, parsed);
}

import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { ensureTrailingNewline } from "@/utils/paths";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(filePath: string): Promise<void> {
  await mkdir(filePath, { recursive: true });
}

export async function ensureParentDirectory(filePath: string): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
}

export async function readText(filePath: string): Promise<string | null> {
  if (!(await pathExists(filePath))) {
    return null;
  }

  return readFile(filePath, "utf8");
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await ensureParentDirectory(filePath);
  await writeFile(filePath, ensureTrailingNewline(content), "utf8");
}

export async function readYaml<T>(filePath: string): Promise<T | null> {
  const content = await readText(filePath);
  if (!content) {
    return null;
  }

  return parseYaml(content) as T;
}

export async function writeYaml(filePath: string, value: unknown): Promise<void> {
  await writeText(filePath, stringifyYaml(value));
}

export async function listDirectory(filePath: string): Promise<string[]> {
  if (!(await pathExists(filePath))) {
    return [];
  }

  return readdir(filePath);
}

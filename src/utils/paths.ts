import path from "node:path";

export function resolveWorkspacePath(root: string, relativePath: string): string {
  return path.join(root, relativePath);
}

export function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

export function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function padSequence(value: number): string {
  return value.toString().padStart(3, "0");
}

export function featureDirectoryName(slug: string, suffix?: number): string {
  return suffix ? `feat-${slug}-${suffix}` : `feat-${slug}`;
}

export function changeDirectoryName(sequence: number, slug: string): string {
  return `change-${padSequence(sequence)}-${slug}`;
}

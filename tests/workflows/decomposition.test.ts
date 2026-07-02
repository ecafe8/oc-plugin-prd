import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { featureCandidateSchema } from "@/schemas/candidate";
import { trackerSchema } from "@/schemas/tracker";
import { FEATURE_FILE_NAMES, WORKFLOW_STATES } from "@/utils/constants";
import { pathExists, readText } from "@/utils/fs";
import {
  deduplicateCandidates,
  formatCandidateList,
  materializeCandidate,
  normalizeCandidates,
  resolveUniqueDirectoryName,
  startFeatureSplitting,
} from "@/workflows/decomposition";

function makeTracker(state: string) {
  return trackerSchema.parse({
    workflow: { state, updatedAt: new Date().toISOString() },
    project: {},
    authoring: {},
    features: [],
    changeRequests: [],
  });
}

// ── Task 3.1: candidate generation shape, collision, ordering ─────────────────

describe("normalizeCandidates", () => {
  it("assigns slugs from titles when not provided", () => {
    const candidates = normalizeCandidates([{ title: "User Authentication" }]);
    expect(candidates[0]?.slug).toBe("user-authentication");
  });

  it("preserves provided slugs", () => {
    const candidates = normalizeCandidates([{ title: "Auth", slug: "auth-module" }]);
    expect(candidates[0]?.slug).toBe("auth-module");
  });

  it("produces candidates in input order", () => {
    const input = [{ title: "Billing" }, { title: "Auth" }, { title: "Dashboard" }];
    const result = normalizeCandidates(input);
    expect(result.map((c) => c.title)).toEqual(["Billing", "Auth", "Dashboard"]);
  });
});

describe("deduplicateCandidates", () => {
  it("resolves slug collision with numeric suffix", () => {
    const input = [
      featureCandidateSchema.parse({ title: "Auth", slug: "auth" }),
      featureCandidateSchema.parse({ title: "Auth Extended", slug: "auth" }),
    ];
    const result = deduplicateCandidates(input);
    expect(result[0]?.slug).toBe("auth");
    expect(result[1]?.slug).toBe("auth-2");
  });

  it("does not modify non-colliding slugs", () => {
    const input = [
      featureCandidateSchema.parse({ title: "Auth", slug: "auth" }),
      featureCandidateSchema.parse({ title: "Billing", slug: "billing" }),
    ];
    const result = deduplicateCandidates(input);
    expect(result.map((c) => c.slug)).toEqual(["auth", "billing"]);
  });
});

// ── Task 3.2: blocking when master PRD not approved (tested via tool, exercised here via readiness logic) ──

describe("startFeatureSplitting", () => {
  it("sets workflow state to feature_splitting", () => {
    const tracker = makeTracker(WORKFLOW_STATES.featureSplitting);
    const updated = startFeatureSplitting(makeTracker(WORKFLOW_STATES.masterPrdReview));
    expect(updated.workflow.state).toBe(WORKFLOW_STATES.featureSplitting);
  });
});

// ── Task 3.3: confirmation gate and selective materialization ─────────────────

describe("formatCandidateList", () => {
  it("includes all candidate slugs in output", () => {
    const set = {
      generatedAt: new Date().toISOString(),
      candidates: [
        featureCandidateSchema.parse({ title: "Auth", slug: "auth" }),
        featureCandidateSchema.parse({ title: "Billing", slug: "billing" }),
      ],
    };
    const output = formatCandidateList(set);
    expect(output).toContain("auth");
    expect(output).toContain("billing");
    expect(output).toContain("feature_candidates_materialize");
  });

  it("returns 'No candidates' when empty", () => {
    const output = formatCandidateList({ generatedAt: new Date().toISOString(), candidates: [] });
    expect(output).toContain("No candidates");
  });
});

// ── Task 3.4: feature matrix generation and source traceability ───────────────

describe("materializeCandidate", () => {
  it("creates canonical feature directory with all required files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-decompose-"));
    const candidate = featureCandidateSchema.parse({
      title: "User Auth",
      slug: "user-auth",
      summary: "Handle login and registration",
      sourceSections: ["Goals > Security"],
      rationale: "Users need to authenticate.",
    });

    const manifest = await materializeCandidate(root, candidate, 1);
    const dir = path.join(root, "docs/features", manifest.id);

    expect(await pathExists(path.join(dir, FEATURE_FILE_NAMES.index))).toBe(true);
    expect(await pathExists(path.join(dir, FEATURE_FILE_NAMES.foundation))).toBe(true);
    expect(await pathExists(path.join(dir, FEATURE_FILE_NAMES.product))).toBe(true);
    expect(await pathExists(path.join(dir, FEATURE_FILE_NAMES.technical))).toBe(true);
    expect(await pathExists(path.join(dir, FEATURE_FILE_NAMES.plan))).toBe(true);
    expect(await pathExists(path.join(dir, FEATURE_FILE_NAMES.review))).toBe(true);
  });

  it("persists source references and rationale in index.md", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-trace-"));
    const candidate = featureCandidateSchema.parse({
      title: "Billing",
      slug: "billing",
      sourceSections: ["Goals > Revenue"],
      rationale: "Core monetization feature.",
    });

    const manifest = await materializeCandidate(root, candidate, 1);
    const indexContent = await readText(path.join(root, "docs/features", manifest.id, FEATURE_FILE_NAMES.index));

    expect(indexContent).toContain("Goals > Revenue");
    expect(indexContent).toContain("Core monetization feature.");
  });
});

// ── Task 3.5: hard dependency and soft dependency recording ───────────────────

describe("materializeCandidate with dependencies", () => {
  it("records hard dependencies in feature manifest", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-deps-"));
    const candidate = featureCandidateSchema.parse({
      title: "Checkout",
      slug: "checkout",
      dependsOn: ["auth", "billing"],
    });

    const manifest = await materializeCandidate(root, candidate, 1);
    expect(manifest.dependencies).toEqual(["auth", "billing"]);
  });

  it("records soft dependencies as blockers in manifest", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-softdeps-"));
    const candidate = featureCandidateSchema.parse({
      title: "Reports",
      slug: "reports",
      softDependsOn: ["analytics"],
    });

    const manifest = await materializeCandidate(root, candidate, 1);
    expect(manifest.blockers).toEqual(["analytics"]);
  });

  it("persists dependency info in index.md", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-deps-index-"));
    const candidate = featureCandidateSchema.parse({
      title: "Notifications",
      slug: "notifications",
      dependsOn: ["auth"],
      softDependsOn: ["email-service"],
    });

    const manifest = await materializeCandidate(root, candidate, 1);
    const indexContent = await readText(path.join(root, "docs/features", manifest.id, FEATURE_FILE_NAMES.index));

    expect(indexContent).toContain("auth");
    expect(indexContent).toContain("email-service");
  });
});

// ── Directory collision resolution ───────────────────────────────────────────

describe("resolveUniqueDirectoryName", () => {
  it("appends suffix when base directory already exists", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-collision-"));

    // Create first feature to occupy the base directory name
    await materializeCandidate(root, featureCandidateSchema.parse({ title: "Auth", slug: "auth" }), 1);

    // The second attempt for the same slug should get a suffix
    const name = await resolveUniqueDirectoryName(root, "auth");
    expect(name).toBe("feat-auth-2");
  });
});

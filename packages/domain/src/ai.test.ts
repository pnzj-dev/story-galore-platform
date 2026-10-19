import { describe, it, expect } from "vitest";
import { computeCreditEligibility, transitionGenerationStatus, resolveCreditEligibleProvider, type AIProvider } from "./ai";

describe("computeCreditEligibility", () => {
  it("allows StoryGalore-managed, credit-eligible cloud models", () => {
    expect(
      computeCreditEligibility({
        billingMode: "PLATFORM_CREDITS",
        executionLocation: "CLOUD",
        ownerType: "STORYGALORE",
        creditEligible: true,
      }),
    ).toEqual({
      eligible: true,
      reason: "STORYGALORE_MANAGED_MODEL",
      fundingSource: "STORYGALORE_MANAGED",
    });
  });

  it("denies workspace-owned models", () => {
    expect(
      computeCreditEligibility({
        billingMode: "PLATFORM_CREDITS",
        executionLocation: "CLOUD",
        ownerType: "WORKSPACE",
        creditEligible: true,
      }),
    ).toEqual({ eligible: false, reason: "PLATFORM_POLICY_DISABLED", fundingSource: "NONE" });
  });

  it("denies models not flagged credit-eligible", () => {
    expect(
      computeCreditEligibility({
        billingMode: "PLATFORM_CREDITS",
        executionLocation: "CLOUD",
        ownerType: "STORYGALORE",
        creditEligible: false,
      }),
    ).toEqual({ eligible: false, reason: "PLATFORM_POLICY_DISABLED", fundingSource: "NONE" });
  });

  it("denies BYOK", () => {
    expect(
      computeCreditEligibility({
        billingMode: "BYOK",
        executionLocation: "CLOUD",
        ownerType: "STORYGALORE",
        creditEligible: true,
      }),
    ).toEqual({ eligible: false, reason: "BYOK", fundingSource: "NONE" });
  });

  it("denies USER_HOSTED billing", () => {
    expect(
      computeCreditEligibility({
        billingMode: "USER_HOSTED",
        executionLocation: "USER_HOSTED",
        ownerType: "STORYGALORE",
        creditEligible: true,
      }),
    ).toEqual({ eligible: false, reason: "USER_HOSTED", fundingSource: "NONE" });
  });

  it("denies PLATFORM_CREDITS with USER_HOSTED execution", () => {
    expect(
      computeCreditEligibility({
        billingMode: "PLATFORM_CREDITS",
        executionLocation: "USER_HOSTED",
        ownerType: "STORYGALORE",
        creditEligible: true,
      }),
    ).toEqual({ eligible: false, reason: "USER_HOSTED", fundingSource: "NONE" });
  });
});

describe("transitionGenerationStatus", () => {
  const happyPath: Array<[string, string, string]> = [
    ["QUEUED", "POLICY_CHECK", "POLICY_CHECK"],
    ["POLICY_CHECK", "ALLOW", "ALLOWED"],
    ["ALLOWED", "RESERVE", "RESERVED"],
    ["RESERVED", "PROCESS", "PROCESSING"],
    ["PROCESSING", "SETTLE", "SETTLING"],
    ["SETTLING", "COMPLETE", "COMPLETED"],
  ];

  it("follows the happy path", () => {
    for (const [from, event, to] of happyPath) {
      expect(transitionGenerationStatus(from as never, event as never)).toBe(to);
    }
  });

  it("supports failure and cancellation transitions", () => {
    expect(transitionGenerationStatus("POLICY_CHECK", "DENY")).toBe("FAILED");
    expect(transitionGenerationStatus("PROCESSING", "FAIL")).toBe("FAILED");
    expect(transitionGenerationStatus("SETTLING", "FAIL")).toBe("FAILED");
    expect(transitionGenerationStatus("QUEUED", "CANCEL")).toBe("CANCELLED");
    expect(transitionGenerationStatus("POLICY_CHECK", "CANCEL")).toBe("CANCELLED");
    expect(transitionGenerationStatus("PROCESSING", "CANCEL")).toBe("CANCELLED");
  });

  it("rejects illegal transitions", () => {
    expect(transitionGenerationStatus("COMPLETED", "SETTLE")).toBeNull();
    expect(transitionGenerationStatus("QUEUED", "COMPLETE")).toBeNull();
    expect(transitionGenerationStatus("ALLOWED", "PROCESS")).toBeNull(); // must RESERVE first
    expect(transitionGenerationStatus("RESERVED", "SETTLE")).toBeNull(); // must PROCESS first
    expect(transitionGenerationStatus("CANCELLED", "PROCESS")).toBeNull();
  });
});

function provider(overrides: Partial<AIProvider> = {}): AIProvider {
  return {
    id: "p-1",
    providerId: "openai",
    displayName: "OpenAI",
    executionLocation: "CLOUD",
    protocol: "OPENAI_COMPATIBLE",
    ownerType: "STORYGALORE",
    ownership: "STORYGALORE",
    creditEligible: true,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveCreditEligibleProvider", () => {
  it("resolves an ACTIVE, CLOUD, STORYGALORE, credit-eligible provider", () => {
    const p = provider();
    expect(resolveCreditEligibleProvider([p])).toBe(p);
  });

  it("fails closed when no providers are registered", () => {
    expect(resolveCreditEligibleProvider([])).toBeNull();
  });

  it("ignores non-credit-eligible providers", () => {
    expect(resolveCreditEligibleProvider([provider({ creditEligible: false })])).toBeNull();
  });

  it("ignores workspace-owned providers", () => {
    expect(resolveCreditEligibleProvider([provider({ ownerType: "WORKSPACE" })])).toBeNull();
  });

  it("ignores disabled providers", () => {
    expect(resolveCreditEligibleProvider([provider({ status: "DISABLED" })])).toBeNull();
  });

  it("ignores user-hosted providers", () => {
    expect(
      resolveCreditEligibleProvider([provider({ executionLocation: "USER_HOSTED" })]),
    ).toBeNull();
  });
});

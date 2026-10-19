import { describe, it, expect } from "vitest";
import { computeCreditEligibility, transitionGenerationStatus } from "./ai";

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

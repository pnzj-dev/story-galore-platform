import { describe, it, expect } from "vitest";
import { computeCreditEligibility } from "./ai";

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

import { describe, it, expect } from "vitest";
import { canAccessAdultContent, type EntitlementSnapshot } from "./index";

function snapshot(overrides: Partial<EntitlementSnapshot> = {}): EntitlementSnapshot {
  return {
    userId: "user-1",
    authenticated: true,
    ageEligible: true,
    paid: true,
    entitlements: [],
    evaluatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("canAccessAdultContent", () => {
  it("denies unauthenticated users regardless of age or payment", () => {
    const decision = canAccessAdultContent(
      snapshot({ authenticated: false, ageEligible: true, paid: true }),
    );
    expect(decision).toEqual({ allowed: false, reason: "AUTH_REQUIRED" });
  });

  it("denies authenticated users who are not age-eligible", () => {
    const decision = canAccessAdultContent(
      snapshot({ authenticated: true, ageEligible: false, paid: true }),
    );
    expect(decision).toEqual({ allowed: false, reason: "AGE_REQUIRED" });
  });

  it("denies age-eligible users who have not paid", () => {
    const decision = canAccessAdultContent(
      snapshot({ authenticated: true, ageEligible: true, paid: false }),
    );
    expect(decision).toEqual({ allowed: false, reason: "PAYMENT_REQUIRED" });
  });

  it("allows authenticated, age-eligible, paid users", () => {
    const decision = canAccessAdultContent(snapshot());
    expect(decision).toEqual({ allowed: true, reason: "ALLOWED" });
  });
});

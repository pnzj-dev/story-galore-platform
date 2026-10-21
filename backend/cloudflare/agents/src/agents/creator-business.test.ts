import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { CREATOR_BUSINESS_MANIFEST } from '../manifests';

test('creator-business: manifest contract is well-formed', () => {
  assert.equal(CREATOR_BUSINESS_MANIFEST.slug, 'creator-business');
  assert.ok(CREATOR_BUSINESS_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(CREATOR_BUSINESS_MANIFEST.capabilities.forbidden.length > 0);
});

test('creator-business: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(CREATOR_BUSINESS_MANIFEST);
  for (const cap of CREATOR_BUSINESS_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('creator-business: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(CREATOR_BUSINESS_MANIFEST);
  for (const cap of CREATOR_BUSINESS_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('creator-business: unknown capability is denied', () => {
  const policy = new PolicyEngine(CREATOR_BUSINESS_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('creator-business: delegation is enforced', () => {
  const policy = new PolicyEngine(CREATOR_BUSINESS_MANIFEST);
  const allowed = CREATOR_BUSINESS_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

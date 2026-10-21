import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { COMMUNITY_GUARDIAN_MANIFEST } from '../manifests';

test('community-guardian: manifest contract is well-formed', () => {
  assert.equal(COMMUNITY_GUARDIAN_MANIFEST.slug, 'community-guardian');
  assert.ok(COMMUNITY_GUARDIAN_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(COMMUNITY_GUARDIAN_MANIFEST.capabilities.forbidden.length > 0);
});

test('community-guardian: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(COMMUNITY_GUARDIAN_MANIFEST);
  for (const cap of COMMUNITY_GUARDIAN_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('community-guardian: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(COMMUNITY_GUARDIAN_MANIFEST);
  for (const cap of COMMUNITY_GUARDIAN_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('community-guardian: unknown capability is denied', () => {
  const policy = new PolicyEngine(COMMUNITY_GUARDIAN_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('community-guardian: delegation is enforced', () => {
  const policy = new PolicyEngine(COMMUNITY_GUARDIAN_MANIFEST);
  const allowed = COMMUNITY_GUARDIAN_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

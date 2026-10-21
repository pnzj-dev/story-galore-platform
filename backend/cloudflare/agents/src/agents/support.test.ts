import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { SUPPORT_MANIFEST } from '../manifests';

test('support: manifest contract is well-formed', () => {
  assert.equal(SUPPORT_MANIFEST.slug, 'support');
  assert.ok(SUPPORT_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(SUPPORT_MANIFEST.capabilities.forbidden.length > 0);
});

test('support: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(SUPPORT_MANIFEST);
  for (const cap of SUPPORT_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('support: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(SUPPORT_MANIFEST);
  for (const cap of SUPPORT_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('support: unknown capability is denied', () => {
  const policy = new PolicyEngine(SUPPORT_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('support: delegation is enforced', () => {
  const policy = new PolicyEngine(SUPPORT_MANIFEST);
  const allowed = SUPPORT_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

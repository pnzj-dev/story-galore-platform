import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { INFRASTRUCTURE_MANIFEST } from '../manifests';

test('infrastructure: manifest contract is well-formed', () => {
  assert.equal(INFRASTRUCTURE_MANIFEST.slug, 'infrastructure');
  assert.ok(INFRASTRUCTURE_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(INFRASTRUCTURE_MANIFEST.capabilities.forbidden.length > 0);
});

test('infrastructure: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(INFRASTRUCTURE_MANIFEST);
  for (const cap of INFRASTRUCTURE_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('infrastructure: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(INFRASTRUCTURE_MANIFEST);
  for (const cap of INFRASTRUCTURE_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('infrastructure: unknown capability is denied', () => {
  const policy = new PolicyEngine(INFRASTRUCTURE_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('infrastructure: delegation is enforced', () => {
  const policy = new PolicyEngine(INFRASTRUCTURE_MANIFEST);
  const allowed = INFRASTRUCTURE_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

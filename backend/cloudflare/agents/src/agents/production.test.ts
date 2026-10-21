import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { PRODUCTION_MANIFEST } from '../manifests';

test('production: manifest contract is well-formed', () => {
  assert.equal(PRODUCTION_MANIFEST.slug, 'production');
  assert.ok(PRODUCTION_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(PRODUCTION_MANIFEST.capabilities.forbidden.length > 0);
});

test('production: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(PRODUCTION_MANIFEST);
  for (const cap of PRODUCTION_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('production: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(PRODUCTION_MANIFEST);
  for (const cap of PRODUCTION_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('production: unknown capability is denied', () => {
  const policy = new PolicyEngine(PRODUCTION_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('production: delegation is enforced', () => {
  const policy = new PolicyEngine(PRODUCTION_MANIFEST);
  const allowed = PRODUCTION_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

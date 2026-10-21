import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { CODING_DEV_MANIFEST } from '../manifests';

test('coding-dev: manifest contract is well-formed', () => {
  assert.equal(CODING_DEV_MANIFEST.slug, 'coding-dev');
  assert.ok(CODING_DEV_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(CODING_DEV_MANIFEST.capabilities.forbidden.length > 0);
});

test('coding-dev: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(CODING_DEV_MANIFEST);
  for (const cap of CODING_DEV_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('coding-dev: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(CODING_DEV_MANIFEST);
  for (const cap of CODING_DEV_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('coding-dev: unknown capability is denied', () => {
  const policy = new PolicyEngine(CODING_DEV_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('coding-dev: delegation is enforced', () => {
  const policy = new PolicyEngine(CODING_DEV_MANIFEST);
  const allowed = CODING_DEV_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

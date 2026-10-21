import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { MEDIA_OPERATIONS_MANIFEST } from '../manifests';

test('media-operations: manifest contract is well-formed', () => {
  assert.equal(MEDIA_OPERATIONS_MANIFEST.slug, 'media-operations');
  assert.ok(MEDIA_OPERATIONS_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(MEDIA_OPERATIONS_MANIFEST.capabilities.forbidden.length > 0);
});

test('media-operations: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(MEDIA_OPERATIONS_MANIFEST);
  for (const cap of MEDIA_OPERATIONS_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('media-operations: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(MEDIA_OPERATIONS_MANIFEST);
  for (const cap of MEDIA_OPERATIONS_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('media-operations: unknown capability is denied', () => {
  const policy = new PolicyEngine(MEDIA_OPERATIONS_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('media-operations: delegation is enforced', () => {
  const policy = new PolicyEngine(MEDIA_OPERATIONS_MANIFEST);
  const allowed = MEDIA_OPERATIONS_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

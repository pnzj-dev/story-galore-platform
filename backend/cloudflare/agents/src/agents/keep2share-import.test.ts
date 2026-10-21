import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { KEEP2SHARE_IMPORT_MANIFEST } from '../manifests';

test('keep2share-import: manifest contract is well-formed', () => {
  assert.equal(KEEP2SHARE_IMPORT_MANIFEST.slug, 'keep2share-import');
  assert.ok(KEEP2SHARE_IMPORT_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(KEEP2SHARE_IMPORT_MANIFEST.capabilities.forbidden.length > 0);
});

test('keep2share-import: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(KEEP2SHARE_IMPORT_MANIFEST);
  for (const cap of KEEP2SHARE_IMPORT_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('keep2share-import: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(KEEP2SHARE_IMPORT_MANIFEST);
  for (const cap of KEEP2SHARE_IMPORT_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('keep2share-import: unknown capability is denied', () => {
  const policy = new PolicyEngine(KEEP2SHARE_IMPORT_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('keep2share-import: delegation is enforced', () => {
  const policy = new PolicyEngine(KEEP2SHARE_IMPORT_MANIFEST);
  const allowed = KEEP2SHARE_IMPORT_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

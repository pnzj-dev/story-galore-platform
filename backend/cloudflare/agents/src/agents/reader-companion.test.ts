import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { READER_COMPANION_MANIFEST } from '../manifests';

test('reader-companion: manifest contract is well-formed', () => {
  assert.equal(READER_COMPANION_MANIFEST.slug, 'reader-companion');
  assert.ok(READER_COMPANION_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(READER_COMPANION_MANIFEST.capabilities.forbidden.length > 0);
});

test('reader-companion: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(READER_COMPANION_MANIFEST);
  for (const cap of READER_COMPANION_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('reader-companion: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(READER_COMPANION_MANIFEST);
  for (const cap of READER_COMPANION_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('reader-companion: unknown capability is denied', () => {
  const policy = new PolicyEngine(READER_COMPANION_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('reader-companion: delegation is enforced', () => {
  const policy = new PolicyEngine(READER_COMPANION_MANIFEST);
  const allowed = READER_COMPANION_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

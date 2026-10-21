import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { QA_RELEASE_MANIFEST } from '../manifests';

test('qa-release: manifest contract is well-formed', () => {
  assert.equal(QA_RELEASE_MANIFEST.slug, 'qa-release');
  assert.ok(QA_RELEASE_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(QA_RELEASE_MANIFEST.capabilities.forbidden.length > 0);
});

test('qa-release: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(QA_RELEASE_MANIFEST);
  for (const cap of QA_RELEASE_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('qa-release: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(QA_RELEASE_MANIFEST);
  for (const cap of QA_RELEASE_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('qa-release: unknown capability is denied', () => {
  const policy = new PolicyEngine(QA_RELEASE_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('qa-release: delegation is enforced', () => {
  const policy = new PolicyEngine(QA_RELEASE_MANIFEST);
  const allowed = QA_RELEASE_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { CEO_MANIFEST } from '../manifests';

test('ceo: manifest contract is well-formed', () => {
  assert.equal(CEO_MANIFEST.slug, 'ceo');
  assert.ok(CEO_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(CEO_MANIFEST.capabilities.forbidden.length > 0);
});

test('ceo: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(CEO_MANIFEST);
  for (const cap of CEO_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('ceo: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(CEO_MANIFEST);
  for (const cap of CEO_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('ceo: unknown capability is denied', () => {
  const policy = new PolicyEngine(CEO_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('ceo: delegation is enforced', () => {
  const policy = new PolicyEngine(CEO_MANIFEST);
  const allowed = CEO_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

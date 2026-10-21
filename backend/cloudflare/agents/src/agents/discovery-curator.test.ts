import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { DISCOVERY_CURATOR_MANIFEST } from '../manifests';

test('discovery-curator: manifest contract is well-formed', () => {
  assert.equal(DISCOVERY_CURATOR_MANIFEST.slug, 'discovery-curator');
  assert.ok(DISCOVERY_CURATOR_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(DISCOVERY_CURATOR_MANIFEST.capabilities.forbidden.length > 0);
});

test('discovery-curator: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(DISCOVERY_CURATOR_MANIFEST);
  for (const cap of DISCOVERY_CURATOR_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('discovery-curator: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(DISCOVERY_CURATOR_MANIFEST);
  for (const cap of DISCOVERY_CURATOR_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('discovery-curator: unknown capability is denied', () => {
  const policy = new PolicyEngine(DISCOVERY_CURATOR_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('discovery-curator: delegation is enforced', () => {
  const policy = new PolicyEngine(DISCOVERY_CURATOR_MANIFEST);
  const allowed = DISCOVERY_CURATOR_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

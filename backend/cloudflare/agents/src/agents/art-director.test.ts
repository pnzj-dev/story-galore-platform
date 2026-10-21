import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { ART_DIRECTOR_MANIFEST } from '../manifests';

test('art-director: manifest contract is well-formed', () => {
  assert.equal(ART_DIRECTOR_MANIFEST.slug, 'art-director');
  assert.ok(ART_DIRECTOR_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(ART_DIRECTOR_MANIFEST.capabilities.forbidden.length > 0);
});

test('art-director: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(ART_DIRECTOR_MANIFEST);
  for (const cap of ART_DIRECTOR_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('art-director: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(ART_DIRECTOR_MANIFEST);
  for (const cap of ART_DIRECTOR_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('art-director: unknown capability is denied', () => {
  const policy = new PolicyEngine(ART_DIRECTOR_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('art-director: delegation is enforced', () => {
  const policy = new PolicyEngine(ART_DIRECTOR_MANIFEST);
  const allowed = ART_DIRECTOR_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

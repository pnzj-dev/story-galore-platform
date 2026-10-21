import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { ORCHESTRATOR_MANIFEST } from '../manifests';

test('orchestrator: manifest contract is well-formed', () => {
  assert.equal(ORCHESTRATOR_MANIFEST.slug, 'orchestrator');
  assert.ok(ORCHESTRATOR_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(ORCHESTRATOR_MANIFEST.capabilities.forbidden.length > 0);
});

test('orchestrator: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(ORCHESTRATOR_MANIFEST);
  for (const cap of ORCHESTRATOR_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('orchestrator: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(ORCHESTRATOR_MANIFEST);
  for (const cap of ORCHESTRATOR_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('orchestrator: unknown capability is denied', () => {
  const policy = new PolicyEngine(ORCHESTRATOR_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('orchestrator: delegation is enforced', () => {
  const policy = new PolicyEngine(ORCHESTRATOR_MANIFEST);
  const allowed = ORCHESTRATOR_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

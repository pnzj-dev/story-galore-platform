import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { STORY_GUARDIAN_MANIFEST } from '../manifests';

test('story-guardian: manifest contract is well-formed', () => {
  assert.equal(STORY_GUARDIAN_MANIFEST.slug, 'story-guardian');
  assert.ok(STORY_GUARDIAN_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(STORY_GUARDIAN_MANIFEST.capabilities.forbidden.length > 0);
});

test('story-guardian: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(STORY_GUARDIAN_MANIFEST);
  for (const cap of STORY_GUARDIAN_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('story-guardian: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(STORY_GUARDIAN_MANIFEST);
  for (const cap of STORY_GUARDIAN_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('story-guardian: unknown capability is denied', () => {
  const policy = new PolicyEngine(STORY_GUARDIAN_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('story-guardian: delegation is enforced', () => {
  const policy = new PolicyEngine(STORY_GUARDIAN_MANIFEST);
  const allowed = STORY_GUARDIAN_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

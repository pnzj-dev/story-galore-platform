import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { STORY_PRODUCER_MANIFEST } from '../manifests';

test('story-producer: manifest contract is well-formed', () => {
  assert.equal(STORY_PRODUCER_MANIFEST.slug, 'story-producer');
  assert.ok(STORY_PRODUCER_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(STORY_PRODUCER_MANIFEST.capabilities.forbidden.length > 0);
});

test('story-producer: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  for (const cap of STORY_PRODUCER_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('story-producer: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  for (const cap of STORY_PRODUCER_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('story-producer: unknown capability is denied', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('story-producer: delegation is enforced', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  const allowed = STORY_PRODUCER_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from './policy';
import { STORY_PRODUCER_MANIFEST, SUPPORT_MANIFEST } from './manifests';

test('story-producer allows an allowed capability', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  assert.doesNotThrow(() => policy.assertCapability('story-bible.propose'));
});

test('story-producer denies a forbidden capability', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  assert.throws(() => policy.assertCapability('policy.bypass'), PolicyDeniedError);
});

test('story-producer denies an unlisted (unknown) capability', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  assert.throws(() => policy.assertCapability('support.ticket.read'), PolicyDeniedError);
});

test('support allows support.ticket.read', () => {
  const policy = new PolicyEngine(SUPPORT_MANIFEST);
  assert.doesNotThrow(() => policy.assertCapability('support.ticket.read'));
});

test('support denies production.deploy_without_approval', () => {
  const policy = new PolicyEngine(SUPPORT_MANIFEST);
  assert.throws(() => policy.assertCapability('production.deploy_without_approval'), PolicyDeniedError);
});

test('story-producer can delegate to story-guardian (allowlist)', () => {
  const policy = new PolicyEngine(STORY_PRODUCER_MANIFEST);
  assert.doesNotThrow(() => policy.assertDelegation('story-guardian'));
});

test('support cannot delegate outside its allowlist', () => {
  const policy = new PolicyEngine(SUPPORT_MANIFEST);
  assert.throws(() => policy.assertDelegation('story-producer'), PolicyDeniedError);
});

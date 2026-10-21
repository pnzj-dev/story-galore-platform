import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, PolicyDeniedError } from '../policy';
import { DATA_ANALYSIS_REPORTING_MANIFEST } from '../manifests';

test('data-analysis-reporting: manifest contract is well-formed', () => {
  assert.equal(DATA_ANALYSIS_REPORTING_MANIFEST.slug, 'data-analysis-reporting');
  assert.ok(DATA_ANALYSIS_REPORTING_MANIFEST.capabilities.allowed.length > 0);
  assert.ok(DATA_ANALYSIS_REPORTING_MANIFEST.capabilities.forbidden.length > 0);
});

test('data-analysis-reporting: allowed capabilities are accepted', () => {
  const policy = new PolicyEngine(DATA_ANALYSIS_REPORTING_MANIFEST);
  for (const cap of DATA_ANALYSIS_REPORTING_MANIFEST.capabilities.allowed) {
    assert.doesNotThrow(() => policy.assertCapability(cap), cap);
  }
});

test('data-analysis-reporting: forbidden capabilities are denied', () => {
  const policy = new PolicyEngine(DATA_ANALYSIS_REPORTING_MANIFEST);
  for (const cap of DATA_ANALYSIS_REPORTING_MANIFEST.capabilities.forbidden) {
    assert.throws(() => policy.assertCapability(cap), PolicyDeniedError);
  }
});

test('data-analysis-reporting: unknown capability is denied', () => {
  const policy = new PolicyEngine(DATA_ANALYSIS_REPORTING_MANIFEST);
  assert.throws(() => policy.assertCapability('__unknown__.capability'), PolicyDeniedError);
});

test('data-analysis-reporting: delegation is enforced', () => {
  const policy = new PolicyEngine(DATA_ANALYSIS_REPORTING_MANIFEST);
  const allowed = DATA_ANALYSIS_REPORTING_MANIFEST.delegation.allowed_agents;
  if (allowed.includes('*')) {
    assert.doesNotThrow(() => policy.assertDelegation('any-agent'));
  } else {
    for (const target of allowed) {
      assert.doesNotThrow(() => policy.assertDelegation(target), target);
    }
    assert.throws(() => policy.assertDelegation('__unknown__'), PolicyDeniedError);
  }
});

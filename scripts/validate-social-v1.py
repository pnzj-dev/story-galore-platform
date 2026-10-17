from pathlib import Path
root=Path(__file__).resolve().parents[1]
required=[
('contracts/social/social-domain.yaml','creator_following'),
('contracts/social/social-domain.yaml','subscriber_only_social_content'),
('contracts/social/social-commands.yaml','creator_follow'),
('contracts/social/social-commands.yaml','social_post_create'),
('contracts/social/social-commands.yaml','social_poll_vote'),
('contracts/social/social-persistence.yaml','social_follows'),
('contracts/social/social-content-policy.yaml','entitlement'),
('contracts/social/social-feed.yaml','stable cursors'),
('contracts/social/social-post.yaml','immutable revision'),
('contracts/social/social-events.yaml','social.creator_followed.v1'),
('contracts/social/social-notification-map.yaml','creator_followed'),
('contracts/state-machines/social.yaml','ACTIVE'),
('contracts/tests/social-v1.scenarios.yaml','social-015'),
('docs/AGENT_SLICE_55_SOCIAL_CORE.md','validate-social-v1.py'),
]
for f,s in required:
 p=root/f
 assert p.exists(), f'MISSING {f}'
 t=p.read_text()
 assert s.lower() in t.lower(), f'MISSING {s} in {f}'
# Cross-boundary safety invariants
policy=(root/'contracts/social/social-content-policy.yaml').read_text()
assert 'entitlement' in policy and 'adult_preference' in policy and 'moderation' in policy
feed=(root/'contracts/social/social-feed.yaml').read_text()
assert 'authorization' in feed.lower() and 'stable cursors' in feed
print('social-v1: PASS (16 invariants)')

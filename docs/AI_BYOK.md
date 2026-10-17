
## Central policy engine and adult controls

BYOK and user-hosted execution always pass through the StoryGalore Policy Engine. They are explicitly credit-ineligible. `USER_HOSTED` does not imply adult permission.

The engine independently evaluates:

- global adult catalog/generation/discovery settings
- user age, geography and entitlement
- publication/moderation state
- provider/model/workflow policy
- capability compatibility
- region/account/product restrictions
- rate/abuse limits

Unknown or expired provider/model policy records are blocked for adult generation until reviewed.

Admin emergency controls may disable BYOK, user-hosted AI, specific capabilities or individual providers without deleting creator work.

See `docs/AI_POLICY_ENGINE.md` and `docs/AI_PROVIDER_REGISTRY.md`.

## Credit boundary

`PLATFORM_CREDITS` is reserved for StoryGalore-managed models. `BYOK` and `USER_HOSTED` never consume creator Studio credits. This is enforced server-side and is not a UI-only rule.

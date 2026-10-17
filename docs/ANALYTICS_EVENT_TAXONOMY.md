# Analytics Event Taxonomy

Event names are stable, lowercase, snake_case. Events must be documented before production use.

Required common properties when applicable:
- `eventVersion`
- `clientPlatform` = WEB | ANDROID | IOS | DESKTOP
- `environment`
- `tenantId` only when strictly required and policy-approved
- `contentType` where relevant
- `contentRating` only when required and permitted

Initial V1 product events:
- `auth_started`
- `auth_completed`
- `creator_onboarding_started`
- `creator_onboarding_completed`
- `content_viewed`
- `content_started`
- `content_completed`
- `reader_page_viewed`
- `reader_completed`
- `subscription_checkout_started`
- `subscription_started`
- `ai_generation_started`
- `ai_generation_completed`
- `download_started`
- `download_completed`
- `search_performed`
- `recommendation_clicked`
- `feature_experiment_exposed`

Do not use raw URLs, free-form prompts, private-message bodies, support bodies, or arbitrary object serialization as event properties.

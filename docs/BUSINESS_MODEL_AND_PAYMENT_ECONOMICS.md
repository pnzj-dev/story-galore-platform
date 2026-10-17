> **V19.5.3 launch correction:** StoryGalore is US-first, operated by a US company, and launch commercial pricing/settlement is USD. International execution is disabled until an approved jurisdiction pack exists.

# StoryGalore V19.5.2 — Business Model & Payment Economics

## Canonical position

StoryGalore is a creator-first media platform with diversified revenue. The platform does **not** rely on a blanket commission and does **not** require a proprietary token. Fiat is the default customer payment experience; USDC is the preferred stablecoin payout rail.

## Creator plans

| Plan | Price | Creator-originated platform fee | Tips |
|---|---:|---:|---:|
| Free | USD 0/mo | 10% | 0% platform fee |
| Pro | USD 12/mo | 5% | 0% platform fee |
| Studio | USD 39/mo | 3% | 0% platform fee |

Annual prices are registered in `contracts/business/revenue-model.yaml` and must not be hard-coded elsewhere.

## Commerce

Creator-originated transactions receive the lowest declared fee. StoryGalore-originated transactions may use a higher 10–15% registered discovery commission. Marketplace services are 10–15%; licensing is 10–20%. Sponsored discovery, AI production services and media usage use registered pricing catalogs.

The financial calculation order is: **gross → taxes → processor cost → StoryGalore commission → creator net**. These dimensions are never collapsed into one opaque fee.

## StoryPass

StoryPass is a target recurring fan product priced at USD 9.99/month. The registered target allocation is 20% platform reserve / 80% creator pool, with creator allocation based on verified engagement. Processor and tax costs remain separate. Discretionary manual allocation is prohibited.

## Stablecoin

The initial stablecoin policy is **USDC on Base**, with USDC on Polygon as a secondary registered rail. Ethereum-mainnet USDC and arbitrary token/network combinations are not supported by default.

Creators may withdraw through bank transfer or registered stablecoin rails. StoryGalore does not take a percentage platform commission on stablecoin payouts. Provider/network costs and any fixed declared service fee remain separate ledger items.

## Wallet UX

Target integrations are Coinbase Wallet, MetaMask and WalletConnect. Wallets are destination-verification mechanisms, not an implicit custody promise. A wallet is verified for an exact asset/network pair; chain mismatch, unsupported token or unverified destination blocks payout.

## Payment providers

The package registers Stripe Connect, NOWPayments, Zen Payments and SecureGlobalPay as **CONDITIONAL** candidates. None is silently declared production-safe. Each requires current provider-contract verification, business-model approval, jurisdiction approval, capability verification, webhook verification, reconciliation testing and human activation. This is particularly important for adult, AI-assisted and UGC models.

The domain ledger remains authoritative. Provider balances never become creator balances. Provider adapters execute registered rails and normalize provider events/errors.

## Additional revenue

Target additional streams are creator-services marketplace, licensing marketplace, sponsored discovery, AI production services and media usage. Organic ranking must not be silently sold. Licensing rights must be explicit.

## Deterministic implementation

Canonical contracts: `contracts/business/`, `contracts/providers/payment-providers.yaml`, and the payment deterministic contracts. The global validator must block unknown providers, unsupported rails, ambiguous fee attribution, missing wallet verification, missing reconciliation, and untested business contracts.

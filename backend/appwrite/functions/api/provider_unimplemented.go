package handler

import (
	"context"
	"errors"
)

// unimplementedAdapter is a fail-safe adapter for providers whose real HTTP
// APIs are not yet integrated. It returns a clear error so the payment fails
// safely (never a silent fake success that would mark an uncharged payment).
type unimplementedAdapter struct{ provider string }

func (u *unimplementedAdapter) CreatePayment(_ context.Context, _, _ string, _ int, _ string) (string, error) {
	return "", errors.New(u.provider + " adapter not yet implemented")
}

func (u *unimplementedAdapter) Refund(_ string, _ int) error {
	return errors.New(u.provider + " adapter not yet implemented")
}

func (u *unimplementedAdapter) CreateSubscription(_ context.Context, _, _, _ string, _ int, _, _ string) (string, error) {
	return "", errors.New(u.provider + " native subscriptions not implemented")
}

func (u *unimplementedAdapter) CancelSubscription(_ string) error {
	return errors.New(u.provider + " native subscriptions not implemented")
}

func (u *unimplementedAdapter) SupportsNativeSubscriptions() bool { return false }

// newProviderAdapter returns the PaymentService adapter for a provider.
// STRIPE uses the real Stripe adapter. Unknown/future providers are fail-safe
// stubs (they route to MERCHANT_MANAGED until a native adapter is added).
func newProviderAdapter(provider, secretKey string) PaymentService {
	if provider == "STRIPE" {
		return newStripeAdapter(secretKey)
	}
	return &unimplementedAdapter{provider: provider}
}

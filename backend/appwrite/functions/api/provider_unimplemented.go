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

// newProviderAdapter returns the PaymentService adapter for a provider.
// STRIPE_CONNECT uses the real Stripe adapter; NOWPAYMENTS, ZEN_PAYMENTS and
// SECUREGLOBALPAY are fail-safe stubs until their HTTP APIs are integrated.
func newProviderAdapter(provider, secretKey string) PaymentService {
	if provider == "STRIPE_CONNECT" {
		return newStripeAdapter(secretKey)
	}
	return &unimplementedAdapter{provider: provider}
}

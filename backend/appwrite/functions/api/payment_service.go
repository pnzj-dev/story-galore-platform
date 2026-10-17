package handler

import "context"

// PaymentService abstracts a payment processor behind a provider-neutral
// interface (AGENTS.md rule 12). Application/domain code depends on this
// interface only, never on a provider SDK. Provider adapters (Stripe, etc.)
// implement it and isolate their SDK usage.
type PaymentService interface {
	// CreatePayment creates a provider-side payment and returns the provider
	// payment ID. amount is in minor currency units. paymentId is the
	// StoryGalore payment ID, attached as provider metadata for webhook linkage.
	CreatePayment(ctx context.Context, userId, paymentId string, amount int, currency string) (string, error)

	// Refund refunds a provider payment. amount is in minor units; 0 means full refund.
	Refund(providerPaymentId string, amount int) error
}

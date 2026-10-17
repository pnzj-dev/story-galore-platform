package handler

import (
	"context"
	"strings"

	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/paymentintent"
	"github.com/stripe/stripe-go/v81/refund"
	"github.com/stripe/stripe-go/v81/webhook"
)

// verifyStripeWebhook verifies a Stripe webhook signature and returns the
// verified event type and event ID. The webhook signing secret (whsec_...) is
// distinct from the API secret key (sk_...).
func verifyStripeWebhook(payload []byte, sigHeader, webhookSecret string) (eventType, eventID string, err error) {
	event, err := webhook.ConstructEvent(payload, sigHeader, webhookSecret)
	if err != nil {
		return "", "", err
	}
	return string(event.Type), event.ID, nil
}

// stripeAdapter implements PaymentService for the STRIPE_CONNECT provider.
// This is the only place the Stripe SDK is used; it is never referenced from
// domain/application code.
type stripeAdapter struct {
	secretKey string
}

func newStripeAdapter(secretKey string) *stripeAdapter {
	return &stripeAdapter{secretKey: secretKey}
}

func (s *stripeAdapter) CreatePayment(_ context.Context, _, paymentId string, amount int, currency string) (string, error) {
	stripe.Key = s.secretKey
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(amount)),
		Currency: stripe.String(strings.ToLower(currency)),
		Metadata: map[string]string{"paymentId": paymentId},
	}
	pi, err := paymentintent.New(params)
	if err != nil {
		return "", err
	}
	return pi.ID, nil
}

func (s *stripeAdapter) Refund(providerPaymentId string, amount int) error {
	stripe.Key = s.secretKey
	params := &stripe.RefundParams{
		PaymentIntent: stripe.String(providerPaymentId),
	}
	if amount > 0 {
		params.Amount = stripe.Int64(int64(amount))
	}
	_, err := refund.New(params)
	return err
}

package handler

import (
	"context"
	"strings"

	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/customer"
	"github.com/stripe/stripe-go/v81/paymentintent"
	"github.com/stripe/stripe-go/v81/price"
	"github.com/stripe/stripe-go/v81/refund"
	"github.com/stripe/stripe-go/v81/subscription"
	"github.com/stripe/stripe-go/v81/webhook"
)

// verifyStripeWebhook verifies a Stripe webhook signature and returns the
// verified event type and event ID. The webhook signing secret (whsec_...) is
// distinct from the API secret key (sk_...).
func verifyStripeWebhook(payload []byte, sigHeader, webhookSecret string) (eventType, eventID string, err error) {
	// Ignore API-version mismatch: the account's default API version can drift
	// ahead of the stripe-go SDK's pinned version. We only read event.Type,
	// event.ID and the raw JSON metadata (never the typed object), so the
	// deserialization risk flagged by Stripe does not apply here.
	event, err := webhook.ConstructEventWithOptions(payload, sigHeader, webhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		return "", "", err
	}
	return string(event.Type), event.ID, nil
}

// stripeAdapter implements PaymentService for the STRIPE provider.
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

// SupportsNativeSubscriptions reports true: Stripe Billing provides a native
// recurring subscription flow.
func (s *stripeAdapter) SupportsNativeSubscriptions() bool { return true }

// CreateSubscription creates a Stripe Billing subscription (Customer + Price +
// Subscription). interval is DAY/WEEK/MONTH/YEAR.
func (s *stripeAdapter) CreateSubscription(_ context.Context, userId, subscriptionId, _ string, amount int, currency, interval string) (string, error) {
	stripe.Key = s.secretKey

	c, err := customer.New(&stripe.CustomerParams{
		Metadata: map[string]string{"userId": userId},
	})
	if err != nil {
		return "", err
	}

	p, err := price.New(&stripe.PriceParams{
		Currency:   stripe.String(strings.ToLower(currency)),
		UnitAmount: stripe.Int64(int64(amount)),
		Recurring:  &stripe.PriceRecurringParams{Interval: stripe.String(strings.ToLower(interval))},
		ProductData: &stripe.PriceProductDataParams{
			Name: stripe.String("StoryGalore subscription"),
		},
	})
	if err != nil {
		return "", err
	}

	sub, err := subscription.New(&stripe.SubscriptionParams{
		Customer: stripe.String(c.ID),
		Items:    []*stripe.SubscriptionItemsParams{{Price: stripe.String(p.ID)}},
		Metadata: map[string]string{"subscriptionId": subscriptionId},
	})
	if err != nil {
		return "", err
	}
	return sub.ID, nil
}

// CancelSubscription cancels a Stripe Billing subscription.
func (s *stripeAdapter) CancelSubscription(providerSubscriptionId string) error {
	stripe.Key = s.secretKey
	_, err := subscription.Cancel(providerSubscriptionId, &stripe.SubscriptionCancelParams{})
	return err
}

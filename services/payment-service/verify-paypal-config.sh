#!/bin/bash

echo "==================================="
echo "PayPal Configuration Verification"
echo "==================================="
echo ""

# Check if environment variables are set
echo "Checking environment variables..."
echo ""

if [ -z "$PAYPAL_CLIENT_ID" ]; then
    echo "❌ PAYPAL_CLIENT_ID is not set"
else
    echo "✅ PAYPAL_CLIENT_ID is set: ${PAYPAL_CLIENT_ID:0:20}..."
fi

if [ -z "$PAYPAL_CLIENT_SECRET" ]; then
    echo "❌ PAYPAL_CLIENT_SECRET is not set"
else
    echo "✅ PAYPAL_CLIENT_SECRET is set: ${PAYPAL_CLIENT_SECRET:0:10}..."
fi

if [ -z "$PAYPAL_MODE" ]; then
    echo "⚠️  PAYPAL_MODE is not set (using default: sandbox)"
else
    echo "✅ PAYPAL_MODE is set: $PAYPAL_MODE"
fi

echo ""
echo "Webhook Endpoints:"
echo "  Local:      http://localhost:9080/api/v1/webhooks/paypal"
echo "  Production: https://your-domain.com/api/v1/webhooks/paypal"
echo ""

echo "Return/Cancel URLs:"
echo "  Return: ${PAYPAL_RETURN_URL:-http://localhost:4200/payment/success}"
echo "  Cancel: ${PAYPAL_CANCEL_URL:-http://localhost:4200/payment/cancel}"
echo ""

echo "==================================="

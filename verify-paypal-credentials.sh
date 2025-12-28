#!/bin/bash

# PayPal Credentials Test Script
# This tests if your PayPal credentials are valid

CLIENT_ID="AXUxkM871s0KCNg2q6ILfRzYED6IefLqWPIEeL4dE05zgibBfurUpTWVAkQQQAdtZQTR85Mx4IZONlZS"
CLIENT_SECRET="ECNFK1NHmxnvQ_Me2pxZ6-gi-IFS9AY4Dc7ge_KCu0IVKCnaWs6d6JCyzCFUxL4XZXoVM5RjwZ4mOrse"
PAYPAL_API="https://api.sandbox.paypal.com"

echo "Testing PayPal Sandbox Credentials..."
echo "======================================"
echo ""
echo "Client ID: ${CLIENT_ID:0:20}..."
echo "Client Secret: ${CLIENT_SECRET:0:20}..."
echo "API Endpoint: $PAYPAL_API"
echo ""

# Try to get access token
echo "Requesting access token..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  "$PAYPAL_API/v1/oauth2/token")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo ""
echo "Response Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ SUCCESS! Your PayPal credentials are valid."
  echo ""
  echo "Access Token Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "✗ FAILED! PayPal rejected your credentials."
  echo ""
  echo "Error Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "Possible reasons:"
  echo "1. Client ID or Secret is incorrect"
  echo "2. These are Live credentials, not Sandbox"
  echo "3. The PayPal app is inactive or deleted"
  echo "4. There's a typo in the credentials"
  echo ""
  echo "Please go to https://developer.paypal.com/dashboard"
  echo "and verify your SANDBOX credentials under Apps & Credentials."
fi

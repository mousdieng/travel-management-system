# SSL Certificates

This directory contains SSL/TLS certificates for the Travel Management System microservices.

## Security Notice ⚠️

**All certificate files (*.pem, *.p12) are gitignored and should NEVER be committed to version control.**

## Quick Start

### Generate Certificates

```bash
./generate-certs.sh
```

This creates:
- `ca-cert.pem` - Certificate Authority (CA) certificate
- `ca-key.pem` - CA private key
- `<service>.p12` - PKCS12 keystore for each service (password: `changeit`)

### Services with Certificates

1. **gateway** - API Gateway (HTTPS endpoint)
2. **user-service** - User authentication and management
3. **travel-service** - Travel and subscription management
4. **payment-service** - Payment processing
5. **feedback-service** - Feedback and reporting
6. **eureka-registry** - Service discovery

## Production Deployment

**⚠️ DO NOT use self-signed certificates in production!**

For production environments:

1. **Obtain certificates from a trusted CA** (Let's Encrypt, DigiCert, etc.)
2. **Use strong keystore passwords** (not 'changeit')
3. **Store certificates securely** (HashiCorp Vault, AWS Secrets Manager, etc.)
4. **Enable certificate rotation** (automated renewal)
5. **Configure HSTS** headers in the API Gateway

## Certificate Renewal

Self-signed certificates are valid for 365 days. Regenerate before expiry:

```bash
rm *.pem *.p12
./generate-certs.sh
```

## Trust Store Configuration

To trust the CA certificate in client applications:

### Java/Spring Boot
```bash
keytool -import -trustcacerts -alias travelms-ca \
  -file ca-cert.pem \
  -keystore $JAVA_HOME/lib/security/cacerts \
  -storepass changeit
```

### System-wide (Linux)
```bash
sudo cp ca-cert.pem /usr/local/share/ca-certificates/travelms-ca.crt
sudo update-ca-certificates
```

## Troubleshooting

### Certificate Errors

```bash
# Verify certificate
openssl x509 -in gateway-cert.pem -text -noout

# Verify keystore
keytool -list -v -keystore gateway.p12 -storepass changeit
```

### Connection Issues

- Ensure firewall allows HTTPS traffic (port 443 or custom SSL ports)
- Verify hostname matches certificate CN (Common Name)
- Check that services are configured to use SSL in application.yml

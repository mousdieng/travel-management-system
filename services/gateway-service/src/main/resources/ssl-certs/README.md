# SSL Certificates for Neo4flix

This directory contains SSL/TLS certificates for securing Neo4flix application.

## Files

- `neo4flix-cert.pem` - Self-signed certificate (public key)
- `neo4flix-key.pem` - Private key
- `neo4flix-keystore.p12` - PKCS12 keystore for Spring Boot

## Security

**IMPORTANT:** These are self-signed certificates for development only.

For production, use proper certificates from:
- Let's Encrypt (free, recommended)
- Commercial CA (DigiCert, Sectigo, etc.)

## Usage

### Gateway Service (Spring Boot)

The keystore is configured in `gateway-service/src/main/resources/application.yml`:

```yaml
server:
  port: 9443
  ssl:
    key-store: file:../../ssl-certs/neo4flix-keystore.p12
    key-store-password: neo4flix123
```

### Nginx

Copy the PEM files to Nginx SSL directory:

```bash
sudo cp neo4flix-cert.pem /etc/nginx/ssl/
sudo cp neo4flix-key.pem /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/neo4flix-key.pem
```

## Regenerating Certificates

If you need to regenerate:

```bash
# Generate new certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout neo4flix-key.pem \
  -out neo4flix-cert.pem \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Neo4flix/OU=Development/CN=localhost"

# Convert to PKCS12
openssl pkcs12 -export \
  -in neo4flix-cert.pem \
  -inkey neo4flix-key.pem \
  -out neo4flix-keystore.p12 \
  -name neo4flix \
  -passout pass:neo4flix123
```

## Trusting Self-Signed Certificate

See [SSL_HTTPS_SETUP.md](../../../../../../docs/SSL_HTTPS_SETUP.md) for instructions on trusting the certificate in your browser.

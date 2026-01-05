# HashiCorp Vault Scripts

This directory contains scripts for initializing and managing HashiCorp Vault in the Travel Management System.

## Quick Start

### 1. Start Vault Container

```bash
docker-compose up -d vault
```

###  2. Initialize Vault with Secrets

```bash
# Method 1: From inside the container
docker exec -it vault sh -c '/vault/scripts/init-vault.sh'

# Method 2: From host (if vault CLI installed)
VAULT_ADDR=http://localhost:8200 VAULT_TOKEN=root-token ./init-vault.sh
```

### 3. Verify Secrets

```bash
# List all secrets
docker exec -it vault vault kv list secret/

# Read specific secret
docker exec -it vault vault kv get secret/application/jwt
```

## Scripts

### `init-vault.sh`

Initializes Vault with all required secrets for the microservices:

- **Database secrets**: PostgreSQL, Redis, Elasticsearch, Neo4j credentials
- **Application secrets**: JWT secret, encryption keys
- **Service secrets**: Individual configurations for each microservice
- **External service secrets**: SMTP, S3/MinIO credentials

## Vault Structure

```
secret/
├── database/
│   ├── postgres
│   ├── redis
│   ├── elasticsearch
│   └── neo4j
├── application/
│   ├── jwt
│   └── encryption
├── services/
│   ├── user-service
│   ├── travel-service
│   ├── payment-service
│   └── feedback-service
└── external/
    ├── email
    └── storage
```

## Development Mode

⚠️ **Vault is running in development mode** with the following caveats:

- Root token: `root-token` (change via `VAULT_ROOT_TOKEN` env var)
- No TLS/SSL
- Data stored in memory (non-persistent in dev mode)
- Auto-unsealed
- Single node

## Production Deployment

For production, configure Vault with:

1. **TLS/SSL enabled**
   ```hcl
   listener "tcp" {
     address     = "0.0.0.0:8200"
     tls_cert_file = "/vault/tls/cert.pem"
     tls_key_file  = "/vault/tls/key.pem"
   }
   ```

2. **Auto-unsealing** (AWS KMS, Azure Key Vault, etc.)
   ```hcl
   seal "awskms" {
     kms_key_id = "your-kms-key-id"
   }
   ```

3. **High Availability** (Consul or Raft storage)
   ```hcl
   storage "consul" {
     address = "consul:8500"
     path    = "vault/"
   }
   ```

4. **AppRole Authentication** for services
   ```bash
   vault auth enable approle
   vault write auth/approle/role/my-service \
     secret_id_ttl=10m \
     token_num_uses=10 \
     token_ttl=20m \
     token_max_ttl=30m \
     secret_id_num_uses=40
   ```

## Common Operations

### Read Secret
```bash
docker exec -it vault vault kv get secret/services/user-service
```

### Update Secret
```bash
docker exec -it vault vault kv put secret/services/user-service \
  db_password=new-password
```

### Delete Secret
```bash
docker exec -it vault vault kv delete secret/services/user-service
```

### List Secrets
```bash
docker exec -it vault vault kv list secret/services/
```

## Troubleshooting

### Vault Not Ready

```bash
docker logs vault
docker exec -it vault vault status
```

### Reset Vault (Development Only)

```bash
docker-compose down -v
docker-compose up -d vault
docker exec -it vault /vault/scripts/init-vault.sh
```

### Access Denied

Ensure you're using the correct token:
```bash
export VAULT_TOKEN=root-token
```

## Security Best Practices

1. **Never commit** the root token to version control
2. **Use AppRole** or other auth methods for services
3. **Enable audit logging** in production
4. **Rotate secrets** regularly
5. **Use policies** to limit access
6. **Enable TLS** for all communication
7. **Back up** Vault data regularly

## Integration with Spring Boot

Services read secrets from Vault using Spring Cloud Vault:

```yaml
spring:
  cloud:
    vault:
      host: localhost
      port: 8200
      scheme: http
      authentication: TOKEN
      token: ${VAULT_TOKEN}
      kv:
        enabled: true
        backend: secret
        application-name: user-service
```

Secrets are automatically injected into application properties!

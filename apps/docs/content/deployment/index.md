---
title: Deployment
---

# Deployment Guide

Complete guide for deploying the Anki Flashcard application to production environments.

## Deployment Options

### 1. Cloud Platforms
- [[#docker|Docker Container]]
- [[#heroku|Heroku]]
- [[#aws|AWS (EC2, ECS, Lambda)]]
- [[#digitalocean|DigitalOcean]]

### 2. Mobile Deployment
- [[#ios|iOS App Store]]
- [[#testflight|TestFlight (Beta)]]
- [[#expo-publish|Expo Publish]]

## Prerequisites

- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Cloud provider account
- Apple Developer account (for iOS)

## Backend Deployment

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary
RUN CGO_ENABLED=1 GOOS=linux go build -o anki-server cmd/server/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/anki-server .

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV DB_PATH=/data/anki.db

# Run
CMD ["./anki-server"]
```

#### Build and Run

```bash
# Build image
docker build -t anki-backend:latest .

# Run container
docker run -d \
  --name anki-backend \
  -p 8080:8080 \
  -v anki-data:/data \
  -e PORT=8080 \
  -e DB_PATH=/data/anki.db \
  anki-backend:latest

# View logs
docker logs -f anki-backend
```

#### Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    volumes:
      - anki-data:/data
      - anki-uploads:/uploads
    environment:
      - PORT=8080
      - DB_PATH=/data/anki.db
      - UPLOAD_DIR=/uploads
      - MAX_UPLOAD_SIZE=1073741824
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  anki-data:
  anki-uploads:
```

**Deploy**:
```bash
docker-compose up -d
```

### Heroku Deployment

#### Procfile

```
web: ./anki-server
```

#### app.json

```json
{
  "name": "Anki Flashcard Backend",
  "description": "Backend for Anki Flashcard App",
  "buildpacks": [
    {
      "url": "heroku/go"
    }
  ],
  "env": {
    "PORT": {
      "description": "Server port (set by Heroku)",
      "value": "8080"
    },
    "DB_PATH": {
      "description": "Database file path",
      "value": "/tmp/anki.db"
    }
  }
}
```

#### Deploy

```bash
# Login
heroku login

# Create app
heroku create anki-backend

# Deploy
git push heroku main

# Open
heroku open
```

**Note**: Heroku's ephemeral filesystem requires a database addon (PostgreSQL) for production.

### AWS Deployment

#### EC2 Instance

**1. Launch Instance**:
```bash
# Connect to instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Go
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Clone repo
git clone https://github.com/techsavvyash/anki.git
cd anki/backend

# Build
go build -o anki-server cmd/server/main.go

# Run with systemd
sudo nano /etc/systemd/system/anki.service
```

**anki.service**:
```ini
[Unit]
Description=Anki Flashcard Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/anki/backend
ExecStart=/home/ec2-user/anki/backend/anki-server
Restart=on-failure
Environment="PORT=8080"
Environment="DB_PATH=/data/anki.db"

[Install]
WantedBy=multi-user.target
```

**Start Service**:
```bash
sudo systemctl enable anki
sudo systemctl start anki
sudo systemctl status anki
```

**2. Configure Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**3. SSL with Let's Encrypt**:
```bash
sudo certbot --nginx -d your-domain.com
```

#### ECS (Fargate)

**task-definition.json**:
```json
{
  "family": "anki-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "anki-backend",
      "image": "your-ecr-repo/anki-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/anki-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### DigitalOcean Deployment

**App Platform**:

1. Connect GitHub repository
2. Configure build:
   - Build Command: `cd backend && go build -o anki-server cmd/server/main.go`
   - Run Command: `./backend/anki-server`
3. Set environment variables
4. Deploy

**Droplet**:

Similar to AWS EC2 deployment (see above).

## Frontend Deployment

### iOS App Store

#### Prerequisites

- Apple Developer Account ($99/year)
- Xcode installed
- Valid signing certificates

#### Build for Release

**1. Update Configuration**:

```typescript
// mobile/src/api/client.ts
const API_BASE_URL = 'https://your-api-domain.com';
```

**2. Update app.json**:
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.anki",
      "buildNumber": "1"
    }
  }
}
```

**3. Build with EAS**:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

#### Manual Build

```bash
cd mobile

# Generate native iOS project
npx expo prebuild

cd ios

# Open in Xcode
open AnkiMobile.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device"
# 2. Product → Archive
# 3. Distribute App
# 4. Upload to App Store Connect
```

### TestFlight (Beta Testing)

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Submit
eas submit --platform ios --latest

# Or in Xcode after Archive:
# Distribute App → TestFlight & App Store
```

**Invite Testers**:
1. App Store Connect → TestFlight
2. Add internal/external testers
3. Share invite link

### Expo Publish

**Development/Staging**:

```bash
# Publish update
npx expo publish

# Channel-based deployment
npx expo publish --release-channel staging
npx expo publish --release-channel production
```

**OTA Updates**:

```bash
# Update app without App Store review
eas update --branch production --message "Bug fixes"
```

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `DB_PATH` | Database file path | `./anki.db` |
| `UPLOAD_DIR` | Upload directory | `./uploads` |
| `MAX_UPLOAD_SIZE` | Max file size (bytes) | `1073741824` (1GB) |
| `CORS_ORIGINS` | Allowed origins | `*` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `https://api.anki.com` |

## Database Management

### Backup

**SQLite**:
```bash
# Backup
sqlite3 anki.db ".backup 'anki-backup.db'"

# Or with script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 /data/anki.db ".backup '/backups/anki-${DATE}.db'"

# Automate with cron
0 0 * * * /path/to/backup-script.sh
```

### Migration

**For PostgreSQL** (future):

```bash
# Install migrate tool
brew install golang-migrate

# Create migration
migrate create -ext sql -dir migrations -seq init_schema

# Run migrations
migrate -path migrations -database "postgres://..." up
```

### Restore

```bash
# Restore from backup
cp anki-backup.db anki.db

# Or
sqlite3 anki.db < backup.sql
```

## Monitoring

### Health Checks

```bash
# Basic health check
curl https://your-api.com/health

# With monitoring (Uptime Robot, Pingdom, etc.)
# Configure to check /health every 5 minutes
```

### Logging

**Backend**:

```go
// Use structured logging
log.Printf("[INFO] Server started on port %s", port)
log.Printf("[ERROR] Database error: %v", err)
```

**Centralized Logging**:
- **CloudWatch** (AWS)
- **Stackdriver** (GCP)
- **Papertrail**
- **Loggly**

### Error Tracking

**Sentry**:

```go
import "github.com/getsentry/sentry-go"

sentry.Init(sentry.ClientOptions{
    Dsn: "your-dsn",
})

// Capture errors
sentry.CaptureException(err)
```

### Performance Monitoring

**New Relic, DataDog, or similar**:

```go
// Instrument your code
// Track request duration, database queries, etc.
```

## Security

### SSL/TLS

**Let's Encrypt** (free):

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Environment Secrets

**Never commit secrets**. Use:

- **AWS Secrets Manager**
- **Heroku Config Vars**
- **Docker Secrets**
- **.env files** (gitignored)

```bash
# .env (example - DO NOT COMMIT)
DB_PASSWORD=super_secret_password
JWT_SECRET=another_secret_key
```

### Rate Limiting

**Nginx**:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location / {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:8080;
}
```

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker image
        run: docker build -t anki-backend:${{ github.sha }} ./backend

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push anki-backend:${{ github.sha }}

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            docker pull anki-backend:${{ github.sha }}
            docker stop anki-backend || true
            docker rm anki-backend || true
            docker run -d --name anki-backend -p 8080:8080 anki-backend:${{ github.sha }}

  deploy-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd mobile && npm install

      - name: Build with EAS
        run: |
          npm install -g eas-cli
          eas build --platform ios --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Scaling

### Horizontal Scaling

**Load Balancer**:

```nginx
upstream backend {
    server backend1.example.com:8080;
    server backend2.example.com:8080;
    server backend3.example.com:8080;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
    }
}
```

### Database Scaling

**Read Replicas**:
- Primary: Writes
- Replicas: Reads

**Sharding** (future):
- Shard by user_id
- Distribute across multiple databases

### Caching

**Redis**:

```go
// Cache frequently accessed data
cache.Set("deck:123", deckData, 10*time.Minute)
```

## Rollback Strategy

### Backend

```bash
# Docker rollback
docker stop anki-backend
docker run -d --name anki-backend -p 8080:8080 anki-backend:previous-tag

# Git rollback
git revert <commit-hash>
git push origin main
```

### Mobile

**Expo OTA**:
```bash
# Rollback to previous publish
eas update --branch production --message "Rollback" --republish
```

**App Store**:
- Cannot rollback published version
- Submit new version with fixes
- Can remove from sale temporarily

## Troubleshooting

### Backend Not Starting

1. Check logs: `docker logs anki-backend`
2. Verify port availability: `lsof -i :8080`
3. Check database permissions
4. Verify environment variables

### Database Connection Issues

1. Check file permissions
2. Verify DB_PATH is correct
3. Check disk space
4. Review SQLite locks

### Upload Failures

1. Check UPLOAD_DIR permissions
2. Verify MAX_UPLOAD_SIZE
3. Check disk space
4. Review nginx/proxy timeouts

## Related Documentation

- [[production-checklist|Production Checklist]]
- [[ssl-setup|SSL Setup Guide]]
- [[monitoring|Monitoring Guide]]
- [[../getting-started/index|Getting Started]]
- [[../architecture/index|Architecture]]

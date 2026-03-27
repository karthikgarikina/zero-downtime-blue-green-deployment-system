# 🚀 Zero-Downtime Blue-Green Deployment System

## 📌 Overview

This project implements a **production-grade Blue-Green Deploymentsystem** using: 
- Docker & Docker Compose 
- Nginx (Load Balancer) 
- PostgreSQL 
- Shell scripting automation

It ensures: 
- ✅ Zero downtime deployments 
- ✅ Safe database migrations(Expand-Contract pattern) 
- ✅ Instant rollback capability 
- ✅ Health-based traffic switching

------------------------------------------------------------------------

## 🏗️ Architecture

-   **Blue (v1.0)** → Current live version
-   **Green (v2.0)** → New version
-   **Nginx** → Routes traffic
-   **PostgreSQL** → Shared database

------------------------------------------------------------------------

## ⚙️ Setup Guide

### 1. Clone Repository

``` bash
git clone 
cd zero-downtime-blue-green-deployment-system
```

### 2. Run System

``` bash
docker-compose up -d --build
```

------------------------------------------------------------------------

## 🌐 API Endpoints

### 🔵 Blue (v1.0)

-   `GET /api/version`
-   CRUD `/api/users`

Response:

``` json
{
  "version": "1.0.0",
  "environment": "blue"
}
```

------------------------------------------------------------------------

### 🟢 Green (v2.0)

-   Extended fields:
    -   phone_number
    -   profile_picture_url
-   Feature Flags:
    -   `GET /api/features`
    -   `PUT /api/features/:name`

Response:

``` json
{
  "version": "2.0.0",
  "environment": "green",
  "features": {
    "phoneNumber": true,
    "profilePicture": false
  }
}
```

------------------------------------------------------------------------

## 🔄 Deployment Flow

### Deploy Green

``` bash
./scripts/deploy-green.sh
```

Steps: 
1. Expand DB schema 
2. Start Green 
3. Health check 
4. Smoke test
5. Switch traffic (Nginx) 
6. Stop Blue 
7. Backfill data

------------------------------------------------------------------------

### Rollback

``` bash
./scripts/rollback.sh
```

- Automatically blocked if contract applied

------------------------------------------------------------------------

### Contract (Final Step)

``` bash
./scripts/contract.sh
```

⚠️ After this, rollback is **not possible**

------------------------------------------------------------------------

## 🧪 Smoke Testing

``` bash
./scripts/smoke-test.sh http://localhost:8080
```

------------------------------------------------------------------------

## Video demo


## 🧠 Key Design Decisions

### Blue-Green Strategy

Ensures zero downtime by switching traffic instantly.

### Expand-Contract Pattern

-   Expand → Add columns (safe)
-   Deploy → Run new version
-   Backfill → Populate data
-   Contract → Apply breaking changes

### Rollback Protection

Rollback is blocked if contract is applied to prevent DB inconsistency.

------------------------------------------------------------------------

## 📁 Project Structure

    app/
      v1.0/
      v2.0/
    scripts/
      deploy-green.sh
      rollback.sh
      smoke-test.sh
      contract.sh
      migrations/
    config/
      nginx.conf
    docker-compose.yml

------------------------------------------------------------------------

## ✅ Features Implemented

-   Zero downtime deployment
-   Health checks & readiness probes
-   Graceful shutdown
-   Feature flags
-   Automated testing
-   Safe rollback
-   Idempotent scripts

------------------------------------------------------------------------

## 🎯 Conclusion

This project simulates a **real-world DevOps deployment pipeline** and
demonstrates strong understanding of: 
- System reliability 
- Deployment strategies 
- Database migration safety

------------------------------------------------------------------------

Built for learning and production-grade understanding.

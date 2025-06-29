# NMRLipids Data Portal

This repository contains a full-stack application adding new simulation info files to the Bilayer data repository on github.

* **Databank API** – a Flask/Gunicorn service serving composition data from the Databank library
* **Portal Backend** – a Flask/Gunicorn service that provides authenticated endpoints for file uploads and user authentitcation through github and proxies to the Databank API
* **Frontend** – a React single-page app served by Nginx

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)

   * [Environment Variables](#environment-variables)
   * [Docker Compose](#docker-compose)
4. [Services](#services)

   * [Databank API](#databank-api)
   * [Portal Backend](#portal-backend)
   * [Frontend](#frontend)
5. [Deployment](#deployment)

   * [Frontend Build & Deploy](#frontend-build--deploy)
   * [Nginx Configuration (Example)](#nginx-configuration-example)
6. [License](#license)

---

## Architecture

```text
┌──────────────────┐    ┌──────────────────┐     ┌──────────────────┐
│    Frontend      │◄──►│  Portal Backend  │◄──► │   Databank API   │
│ (React + Nginx)  │    │ (Flask/Gunicorn) │     │ (Flask/Gunicorn) │
└──────────────────┘    └──────────────────┘     └──────────────────┘


```

Portal Backend and Databank APi are run in Docker containers on a shared Docker network.

Nginx makes all traffic directed towards /app/ go to the Portal-Backend.

Communication towards the Databank Api container is done exclusively through the Backend.

---

## Prerequisites

* Docker & Docker Compose (v3.8+)
* Node.js & npm (for local frontend development)
* Git (for building the Databank API image)
* Nginx 

There are more depedencies within related projects, i.e nmrlipids/databank. These are installed in docker images and not needed in local environment.

---

## Getting Started

### Environment Variables

Create a `backend.env` file with your secrets inside a backend startup folder located right outside the clone of this repository.

```ini
# backend.env
clientsecret=example_client_secret
GITHUB_TOKEN=example_github_token
GITHUB_TARGET_TOKEN=example_github_target_token
GITHUB_SERVER_AUTH_TOKEN=example_server_auth_token
```
The docker compose file, if not changed, will look for it in ` ../startup/backend.env`

This can be changed to preferred location in the `docker-compose.yml` file.

**CRITICALLY IMPORTANT**: the .env file with secrets should never be added to any github repository. This repository will automatically ignore all .env files, but it's still best practices to never put the `backend.env` inside it. 

### Docker Compose (will only start backend services)

Bring up all services:

```bash
docker-compose up 
```

This will:

* Build the images for the Databank API and Portal Backend
* Start the Databank API on port **8000**
* Start the Portal Backend on port **5001**

To stop and remove containers:

```bash
docker-compose down
```

Note that on first build this will be slower since everything is built from scratch. Expect it to take ~ 2 minutes to start everything the first time. The next start ups will be fast <10 seconds.

To completely remove all docker related resources the following command can be used:
```
docker system prune -a
```

---

## Services

### Databank API

* **Image**: `nmrlipids/databank_api:latest`
* **Port**: `8000`
* **Env**:

  * `DATABANK_PATH` – path to the cloned Databank repo inside the container
  * `LOCAL_STATIC` – where `molecules.json` is written

**Endpoints**:

* `GET  /compositions`
* `POST /refresh-compositions`
* `POST /info-valid-check`
* `GET  /health`

### Portal Backend

* **Image**: `nmrlipids/backend:latest`
* **Port**: `5001`
* **Env**:

  * `DATABANK_API_URL` – e.g. `http://databank-api:8000`
  * Plus GitHub/OAuth secrets via `env_file`

**Endpoints**:

* `GET  /app/awake`
* `POST /app/verifyCode`
* `POST /app/refresh-composition`
* `GET  /app/molecules`
* `POST /app/upload`

Uses Gunicorn with configurable worker count.

### Frontend

Located under `src/Frontend`. Standard Create React App structure; built artifacts go into `/var/www/frontend/build`.

---

## Deployment

### Frontend Build & Deploy

Use the helper script (e.g. on an EC2 instance):

```bash
src/Frontend/build-ec2.sh
```

### Nginx Configuration (Example)

Place a server block in `/etc/nginx/sites-available/project.conf`:

```nginx
server {
    listen 80;
    server_name (SEVER NAME); 
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name (SEVER NAME);
    ssl_certificate     /etc/letsencrypt/live/magnus-demo-project.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/magnus-demo-project.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /app/ {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

* Static React build served from `/var/www/frontend/build`
* API requests under `/app/` proxied to the Portal Backend

---

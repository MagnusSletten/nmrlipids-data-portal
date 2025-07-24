# NMRLipids Data Portal

This repository contains a full-stack application adding new simulation info files to the Bilayer data repository on github.

* **Frontend** – a React single-page app served by Nginx
* **Github Gateway** – a Flask/Gunicorn service that provides authenticated endpoints for file uploads and user authentitcation through github and proxies to the Databank API
* **Databank API** – a Flask/Gunicorn service serving composition data from the Databank library

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)

   * [Environment Variables](#environment-variables)
   * [Docker Compose](#docker-compose)
4. [Services](#services)

   * [Databank API](#databank-api)
   * [Github Gateway](#github_gateway)
   * [Frontend](#frontend)
5. [Deployment](#deployment)

   * [Frontend Build & Deploy](#frontend-build--deploy)
   * [Nginx Configuration (Example)](#nginx-configuration-example)
6. [License](#license)

---

## Architecture

```text
┌──────────────────┐    ┌──────────────────┐     ┌──────────────────┐
│    Frontend      │◄──►│  Github Gateway  │◄──► │   Databank API   │
│ (React + Nginx)  │    │ (Flask/Gunicorn) │     │ (Flask/Gunicorn) │
└──────────────────┘    └──────────────────┘     └──────────────────┘


```

Github Gateway and Databank APi are run in Docker containers on a shared Docker network.

Nginx makes all traffic directed towards /app/ go to the Github Gateway.

Communication towards the Databank Api container is done exclusively through the Github Gateway.

Authentication is done via Github's API through a registered a Github Oauth application.  

---

## Prerequisites

* Docker & Docker Compose (v3.8+)
* Node.js & npm (for local frontend development)
* Git (for building the Databank API image)
* Nginx for handling secure HTTPS traffic. 

There are more depedencies within related projects, i.e nmrlipids/databank but these are installed in docker images and not needed in local environment.

---

## Getting Started

### Environment Variables

Create a `backend.env` file with your secrets inside a backend startup folder located right outside the clone of this repository within `startup/backend.env`

An example env file is located within this repository here:
`src\Configuration\example-env-file.txt` and it will list all required evironmental txt files. 

The docker compose file, if not changed, will look for it in  `../startup/backend.env`

```text
Your-start-location/
├── nmrlipids-data-portal/
│  
└── startup/
    └── backend.env      # environment vars for backend

```
This can be changed to preferred location in the `docker-compose.yml` file.

**CRITICALLY IMPORTANT**: the .env file with secrets should never be added to any github repository. This repository will automatically ignore all .env files, but it's still best practices to never put the `backend.env` inside it. 

### Docker Compose (will only start backend services)

Bring up all services in detatched mode:

```bash
docker-compose up -d 
```
Removing -d from the command would start the containers attached and stream their logs live in your terminal.

This will:

* Build the images for the Databank API and Github Gateway
* Start the Databank API on port **8000**
* Start the Github Gateway on port **5001**

To stop and remove containers:

```bash
docker-compose down
```

Note that on first build this will be slower since everything is built from scratch. Expect it to take ~ 2-3 minutes to start everything the first time. The next start ups will be fast: <15 seconds.

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

### Github_gateway

* **Image**: `nmrlipids/github_gateway:latest`
* **Port**: `5001`
* **Env**:

  * `DATABANK_API_URL` – e.g. `http://databank-api:8000`
  * Plus GitHub/OAuth secrets via `env_file` as described above

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

Use the helper script *from inside the `Frontend` folder*. 

Look at the deployment details within the script first: By default it will delete the contents of: `/var/www/frontend/build` then move the newly built files there. 

```bash
cd src/Frontend
build.sh
```

If you want a different Node deployment location it can be changed within the `src/Frontend/build.sh` script. 

### Nginx Configuration (Example)

For HTTPS traffic with a specific domain. 

Place server blocks in `/etc/nginx/sites-available/upload-portal.conf`:

(SSL certificates should be managed before changing this file accordingly)

Example of the Nginx block is found in this repository at the following location: 
`src\Configuration\nginx_config.conf`

---

# Docker Image Setup from Docker Hub

<!-- Center alignment using HTML comments -->

![docker-logo](https://www.docker.com/app/uploads/2023/08/logo-guide-logos-1.svg)

## Creating a Docker Network

create a Docker network to allow containers to communicate with each other.

```bash
docker network create dreach-network
```

## Docker run command for postgres

Run the PostgreSQL container with the following command:

```bash
docker run -p 5432:5432 --network dreach-network --env=POSTGRES_USER=dreachBackend --env=POSTGRES_PASSWORD=dreachBackend123 --env=POSTGRES_DB=dreach --name dreach-postgres sudsarkar13/dreach-backend:postgres
```

## Run docker container with additional flags

Run your Docker container with these additional flags:

```bash
docker run -p 4000:4000 --network dreach-network --add-host=localhost:host-gateway dreach-server
```

- Use the below command to run from the dockerhub image to create the container:

```bash
docker run -p 4000:4000 --network dreach-network --add-host=localhost:host-gateway --name dreach-server sudsarkar13/dreach-backend:dreach-server
```

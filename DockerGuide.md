# Docker Guide

<!-- Center alignment using HTML comments -->

![docker-logo](https://www.docker.com/app/uploads/2023/08/logo-guide-logos-1.svg)

## What is Docker?

Docker is an open-source platform that automates the deployment of applications inside software containers. It allows developers to package their applications and dependencies into a single container that can be easily deployed and run across different environments.

## Why Docker?

Docker provides a consistent and reproducible environment for developing, testing, and deploying applications. It eliminates the need to worry about compatibility issues between different environments, making it easier to deploy applications across different platforms.

## How to use Docker?

Docker is a command-line tool that allows you to create, build, and manage containers. It provides a set of commands that you can use to interact with containers, including:

- Creating and managing containers
- Building and running containers
- Managing images and images repositories
- Managing networks and volumes
- Managing containers' lifecycles
- Managing containers' storage
- Managing containers' security

## Docker Images

A Docker image is a lightweight, standalone, executable package that includes everything needed to run a piece of software, including the code, runtime, system tools, libraries, and settings. It is a snapshot of a container that can be used to create a new container.

## Docker Containers

A Docker container is a runtime instance of an image. It encapsulates the application and its dependencies, providing a consistent and isolated environment for running the application.

## Docker Compose

Docker Compose is a tool for defining and running multi-container Docker applications. It allows you to define the services and their dependencies in a single file, and then spin up the entire application with a single command.

## Docker Networks

A Docker network is a virtual network that allows containers to communicate with each other. It provides a way to isolate containers and create a secure environment for running applications.

## Docker Volumes

A Docker volume is a directory that is mounted into a container. It allows you to share data between containers and persist data even after the container is removed.

## Docker Hub

Docker Hub is a registry for sharing Docker images. It allows you to store and distribute your Docker images, making it easy to share and collaborate on your applications.

## Docker Swarm

Docker Swarm is a tool for managing a cluster of Docker hosts. It allows you to create a cluster of Docker hosts and deploy and manage applications across the cluster.

### Install Docker

To install Docker, follow the instructions for your operating system:

- [Install Docker on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Install Docker on macOS](https://docs.docker.com/engine/install/macos/)
- [Install Docker on Windows](https://docs.docker.com/desktop/install/windows-install/)

### Create a Docker Network

To create a Docker network, use the following command:

```bash
docker network create <network-name>
```

Replace `<network-name>` with the name you want to give to your network.

### Create a Docker Volume

To create a Docker volume, use the following command:

```bash
docker volume create <volume-name>
```

Replace `<volume-name>` with the name you want to give to your volume.

### Create a Docker Container

To create a Docker container, use the following command:

```bash
docker run -d -p <host-port>:<container-port> <image-name>
```

Replace `<host-port>` with the port you want to expose on the host, `<container-port>` with the port you want to expose on the container, and `<image-name>` with the name of the image you want to run.

### Create a Docker Compose File

To create a Docker Compose file, use the following command:

```bash
docker-compose up -d
```

This command will start all the services defined in the `docker-compose.yml` file.

### Create a Docker Image

To create a Docker image, use the following command:

```bash
docker build -t <image-name> .
```

Replace `<image-name>` with the name you want to give to your image.

### Push a Docker Image to Docker Hub

To push a Docker image to Docker Hub, use the following command:

```bash
docker push <image-name>
```

Replace `<image-name>` with the name of the image you want to push.

### Pull a Docker Image from Docker Hub

To pull a Docker image from Docker Hub, use the following command:

```bash
docker pull <image-name>
```

Replace `<image-name>` with the name of the image you want to pull.

### Run a Docker Container from a Docker Image

To run a Docker container from a Docker image, use the following command:

```bash
docker run -d -p <host-port>:<container-port> <image-name>
```

Replace `<host-port>` with the port you want to expose on the host, `<container-port>` with the port you want to expose on the container, and `<image-name>` with the name of the image you want to run.

### Stop a Docker Container

To stop a Docker container, use the following command:

```bash
docker stop <container-id>
```

Replace `<container-id>` with the ID of the container you want to stop.

### Remove a Docker Container

To remove a Docker container, use the following command:

```bash
docker rm <container-id>
```

Replace `<container-id>` with the ID of the container you want to remove.

### Remove a Docker Image

To remove a Docker image, use the following command:

```bash
docker rmi <image-name>
```

Replace `<image-name>` with the name of the image you want to remove.

### Docker usage in this project

- Create a .dockerignore file in the root directory of your project and add the following lines to it:

```.dockerignore
# Node modules
node_modules

# Build files
dist

# test files
test

# Git files
.git
.gitignore

# prettier config
.prettierrc

# README
README.md

# Dockerfile
Dockerfile
```

- Create a Dockerfile in the root directory of your project and add the following lines to it:

```Dockerfile
FROM node:22.14.0

WORKDIR /app

# Enable Corepack to manage Yarn versions
RUN corepack enable

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock .yarnrc.yml ./

# Copy source code
COPY . .

# Install dependencies
RUN yarn install

# Expose port
EXPOSE 4000

# Start the app
CMD [ "yarn", "start:dev" ]
```

- Create a Docker network to allow container-to-container communication:

```bash
docker network create dreach-network
```

- Update your `.env` file to use host.docker.internal instead of localhost:

```.env
DATABASE_URL=postgresql://dreachBackend:dreachBackend123@host.docker.internal:5432/dreach
# ...rest of the env variables remain same...
```

- Update your Dockerfile to include host.docker.internal DNS:

```dockerfile
FROM node:22.14.0

WORKDIR /app

# Enable Corepack to manage Yarn versions
RUN corepack enable

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install

# Copy the rest of the source code
COPY . .

# Expose port
EXPOSE 4000

CMD [ "yarn", "start:dev" ]
```

- Run your Docker container with these additional flags:

```bash
docker run -p 4000:4000 --network dreach-network --add-host=host.docker.internal:host-gateway dreach-server
```

This setup will:

- Create a Docker network for container communication
- Allow the container to connect to your host machine's PostgreSQL
- Map the container's port 4000 to your host's port 4000
- Add host.docker.internal DNS resolution

To use the `docker run` command with an image from a Docker Hub repository, you need to ensure that the image is available on Docker Hub and then pull it to your local machine if it's not already present. Here's how you can do it:

### Steps to Run a Docker Hub Repository Image

1. **Pull the Image from Docker Hub (if not already available locally):**

   First, make sure the image is available on your local machine. If it's not, Docker will automatically pull it when you run the container. You can also manually pull it using:

   ```bash
   docker pull <YOUR_DOCKER_USERNAME>/<REPO_NAME>:<TAG>
   ```

   Replace `<YOUR_DOCKER_USERNAME>`, `<REPO_NAME>`, and `<TAG>` with your Docker Hub username, repository name, and the tag of the image you want to use.

2. **Run the Image:**

   Use the `docker run` command to start a container from the image. You can apply the same options as before, such as port mapping, network settings, and host configurations.

   ```bash
   docker run -p 4000:4000 --network dreach-network --add-host=host.docker.internal:host-gateway <YOUR_DOCKER_USERNAME>/<REPO_NAME>:<TAG>
   ```

   Replace `<YOUR_DOCKER_USERNAME>`, `<REPO_NAME>`, and `<TAG>` with the appropriate values for your image.

### Example

If your Docker Hub repository is `myusername/dreach-server` and you want to run the `latest` tag, the command would look like this:

```bash
docker run -p 4000:4000 --network dreach-network --add-host=host.docker.internal:host-gateway myusername/dreach-server:latest
```

### Key Points

- **Image Name and Tag**: Ensure you specify the correct image name and tag. If you omit the tag, Docker defaults to `latest`.
- **Network and Host Configurations**: Adjust the network and host settings as needed for your specific use case.
- **Docker Hub Login**: If your repository is private, make sure you are logged in to Docker Hub using `docker login` before pulling or running the image.

For more details on using Docker images from Docker Hub, refer to the [Docker Hub documentation](https://docs.docker.com/docker-hub/).

## Docker Remove Unused Files

To delete unrequired files and save storage in a Docker environment, you can follow these steps:

1. **Remove Unused Containers:**

   - List all containers, including stopped ones:

     ```bash
     docker container ls -a
     ```

   - Remove stopped containers:

     ```bash
     docker container prune
     ```

2. **Remove Unused Images:**

   - List all images:

     ```bash
     docker image ls
     ```

   - Remove unused images (dangling images):

     ```bash
     docker image prune
     ```

   - To remove all unused images, not just dangling ones:

     ```bash
     docker image prune -a
     ```

3. **Remove Unused Volumes:**

   - List all volumes:

     ```bash
     docker volume ls
     ```

   - Remove unused volumes:

     ```bash
     docker volume prune
     ```

4. **Remove Unused Networks:**

   - List all networks:

     ```bash
     docker network ls
     ```

   - Remove unused networks:

     ```bash
     docker network prune
     ```

5. **Remove Build Cache:**

   - To remove the build cache, you can use:

     ```bash
     docker builder prune
     ```

6. **Use `docker system prune`:**

- This command removes all stopped containers, unused networks, dangling images, and build cache:

````bash
     docker system prune
     ```
   - To remove all unused data (including unused images), use:
     ```bash
     docker system prune -a
     ```

**Note:** Be cautious when using these commands, especially with the `-a` flag, as they will remove all unused resources, which might include images or volumes you intended to keep.

For more detailed information, you can refer to the [Docker documentation on cleaning up unused resources](https://docs.docker.com/config/pruning/).
````

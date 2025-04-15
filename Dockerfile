FROM node:22.14.0

# Metadata
LABEL maintainer="Sudeepta Sarkar <sudsarkar13@gmail.com>"
LABEL version="1.0"
LABEL description="Dreach Server Application"

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
# Prisma Guide

## Overview

Prisma is a modern database toolkit that includes an ORM (Object-Relational Mapping) for Node.js and TypeScript. This guide covers essential Prisma CLI commands and their usage.

## Essential Prisma Commands

### 1. View Available Commands

```bash
npx prisma
```

This command displays all available Prisma CLI commands and their descriptions.

### 2. Initialize Prisma in Your Project

```bash
npx prisma init
```

This command:

- Creates a new `prisma` directory
- Adds a `schema.prisma` file with your database connection and schema
- Creates a `.env` file for your database connection URL
- Sets up the initial project structure

### 3. Install Prisma Client

```bash
yarn add @prisma/client
```

Installs the Prisma Client in your project, which provides type-safe database access.

### 4. Create and Apply Migrations

```bash
npx prisma migrate dev --name init
```

This command:

- Detects schema changes
- Creates a new migration file
- Applies the migration to your database
- Regenerates the Prisma Client
  Use descriptive names instead of "init" for subsequent migrations.

### 5. Reset and Push Schema Changes

```bash
npx prisma db push --force-reset
```

This command:

- Pushes schema changes directly to the database
- The `--force-reset` flag resets the database
- Useful in development but be careful in production
- Does not create migration files

### 6. Seed the Database

```bash
npx prisma db seed
```

This command:

- Runs your seed script defined in package.json
- Populates your database with initial data
- Useful for development and testing environments

### 7. Launch Prisma Studio

```bash
npx prisma studio
```

This command:

- Opens a visual database browser at <http://localhost:5555>
- Allows you to view and edit data
- Provides a GUI for database management

### 8. Validate Schema

```bash
npx prisma validate
```

This command:

- Checks your schema.prisma file for errors
- Validates the schema against Prisma's schema specification
- Ensures your schema is correctly formatted

## Best Practices

1. **Version Control**:

   - Always commit your migration files
   - Include schema.prisma in version control
   - Don't commit the .env file

2. **Development Workflow**:

   - Use `migrate dev` during development
   - Use `db push` for quick prototyping
   - Always backup data before migrations

3. **Production Considerations**:

   - Use `prisma migrate deploy` in production
   - Never use `--force-reset` in production
   - Always test migrations in development first

4. **Schema Management**:
   - Regular schema validation
   - Keep migrations small and focused
   - Use meaningful migration names

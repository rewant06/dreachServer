# Dr. Reach Server Documentation

## Overview

This is the backend server for the Dr. Reach healthcare platform, built with NestJS and using Prisma ORM for database management. The server provides APIs for patient-doctor interactions, appointment management, and medical record keeping.

## Project Structure

```
src/
├── admin/          # Admin management functionality
├── auth/           # Authentication and authorization
├── service-providers/  # Healthcare provider management
├── user/           # User management and profiles
├── utils/          # Utility functions
└── storage/        # File storage management
```

## Core Features

- User Authentication & Authorization
- Healthcare Provider Management
- Appointment Scheduling
- Medical Records Management
- Admin Dashboard Support
- File Upload/Storage

## API Endpoints

### Authentication

```
POST /auth/signup            # Register new user
POST /auth/login            # User login
POST /auth/refresh          # Refresh authentication token
```

### User Management

```
POST   /user/signup                     # Create new user account
POST   /user/updateUser                 # Update user profile with optional profile image
POST   /user/applyForServiceProvider    # Apply to become a service provider
GET    /user/doctors                    # Get list of approved doctors
GET    /user/getApprovedServiceProviders # Get all approved service providers
GET    /user/findServiceProvidersByHomeVisit # Get providers offering home visits
GET    /user/findDoctorbyVideoConsultation  # Get doctors offering video consultations
GET    /user/getServiceProvider/:username   # Get specific provider details
GET    /user/getAppointments/:userId       # Get user's appointments
POST   /user/addReview                     # Add review for a service provider
GET    /user/getPopularDoctors            # Get list of popular doctors
```

### Service Provider Endpoints

```
POST   /provider/updateServiceProvider     # Update provider profile
POST   /provider/updateSchedule            # Update availability schedule
POST   /provider/uploadProviderProfile     # Upload provider profile image
POST   /provider/checkProviderAvailability # Check provider's availability
POST   /provider/bookAppointment          # Book an appointment
POST   /provider/integratedBookAppointment # Book integrated care appointment
POST   /provider/actionOnPatients         # Approve/reject/cancel patient appointments
POST   /provider/addMedicalRecord         # Add medical record for patient
POST   /provider/addDocument              # Add provider documents
POST   /provider/removeDocument           # Remove provider documents
GET    /provider/getProviderById/:providerId # Get provider details
GET    /provider/getSchedule/:userId      # Get provider's schedule
GET    /provider/getServiceProvider       # Get provider details with availability
GET    /provider/getScheduleByHomeCare    # Get home care schedule
GET    /provider/getPatients/:providerId  # Get provider's patients
GET    /provider/getPatientMedicalByProvider # Get patient's medical records
GET    /provider/getPatientsMedicalBySelf   # Get self medical records
GET    /provider/getPatientsInfo          # Get patient information
```

### Admin Endpoints

```
# Admin routes for managing users and service providers
# Specific endpoints depend on implementation in AdminController
```

## Authentication

The server uses JWT (JSON Web Tokens) for authentication. All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## File Upload

The server supports file uploads for:

- Profile images
- Medical records
- Provider documents

Files are stored in the `/uploads` directory with proper access controls.

## Environment Configuration

The server requires the following environment variables:

- `PORT`: Server port (default: 4000)
- `DATABASE_URL`: Prisma database connection string
- `JWT_SECRET`: Secret key for JWT token generation
- Other environment-specific configurations

## CORS Configuration

The server is configured to accept requests from:

- http://localhost:3000 (development)
- Other whitelisted origins as configured in main.ts

## Error Handling

The server implements standardized error responses:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Each error response includes:

```json
{
  "statusCode": number,
  "message": string,
  "error": string
}
```

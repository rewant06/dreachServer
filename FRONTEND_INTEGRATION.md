# Frontend Integration Guide

This guide explains how to integrate the Dr. Reach frontend application with the backend server.

## Prerequisites

1. Backend server running (default: http://localhost:4000)
2. Frontend application (Next.js) repository: https://github.com/OrgDrReach/dreach-clone-2025.git

## Configuration Steps

### 1. Environment Setup

Create a `.env.local` file in your frontend project root with:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2. API Client Setup

Create an API client using Axios or fetch. Example using Axios:

```typescript
// utils/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 3. Authentication Integration

```typescript
// services/auth.ts
import api from '../utils/api';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },

  async signup(email: string) {
    return await api.post('/user/signup', { email });
  },

  logout() {
    localStorage.removeItem('token');
  },
};
```

### 4. User Service Integration

```typescript
// services/user.ts
import api from '../utils/api';

export const userService = {
  async updateProfile(data: FormData) {
    return await api.post('/user/updateUser', data);
  },

  async getDoctors() {
    return await api.get('/user/doctors');
  },

  async getServiceProvider(username: string) {
    return await api.get(`/user/getServiceProvider/${username}`);
  },
};
```

### 5. Appointment Integration

```typescript
// services/appointment.ts
import api from '../utils/api';

export const appointmentService = {
  async checkAvailability(providerId: string, date: string, slot: string) {
    return await api.post('/provider/checkProviderAvailability', {
      providerId,
      date,
      slot,
    });
  },

  async bookAppointment(appointmentData: any) {
    return await api.post('/provider/bookAppointment', appointmentData);
  },
};
```

## File Upload Integration

For file uploads, use FormData:

```typescript
// Example of profile image upload
const updateProfile = async (data: any, image: File) => {
  const formData = new FormData();
  if (image) {
    formData.append('profileImage', image);
  }
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });

  return await api.post('/user/updateUser', formData);
};
```

## Error Handling

Implement global error handling:

```typescript
// utils/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

## CORS Considerations

The backend is already configured to accept requests from `http://localhost:3000`. If you're using a different frontend URL, update the CORS configuration in the backend's `main.ts`.

## WebSocket Integration (if needed)

For real-time features, use Socket.io client:

```typescript
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  auth: {
    token: localStorage.getItem('token'),
  },
});

// Listen for events
socket.on('appointment:update', (data) => {
  // Handle real-time appointment updates
});
```

## Development Guidelines

1. Always use TypeScript interfaces for API responses
2. Implement proper loading and error states
3. Use environment variables for configuration
4. Handle token expiration and refresh
5. Implement proper form validation before API calls
6. Use proper error boundaries in React components

## Testing API Integration

1. Use tools like Jest and React Testing Library
2. Mock API calls in tests
3. Test error scenarios and loading states
4. Validate form submissions

## Security Best Practices

1. Never store sensitive data in localStorage
2. Always validate data on both client and server
3. Implement proper CSRF protection
4. Use HTTPS in production
5. Sanitize all user inputs
6. Implement rate limiting on the frontend

## Production Deployment

1. Update environment variables for production
2. Enable production mode in Next.js
3. Configure proper CORS for production domain
4. Enable error logging and monitoring
5. Configure proper caching strategies

# Organization Hierarchy Project

This project consists of a React frontend and a Python FastAPI backend for managing organizational hierarchies.

## Project Structure

- `frontend/`: React application built with Vite
- `backend/`: Python FastAPI backend
- `api/`: Serverless functions for Vercel deployment

## Deployment to Vercel

This project is configured for deployment to Vercel with the following features:

- Frontend React app built with Vite
- Backend API using Python FastAPI as serverless functions
- Automatic routing configuration

### Deployment Steps

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the project:
   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

### Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

- Any database connection strings used by the backend
- Any API keys or secrets used by the application

## Local Development

### Frontend

```
cd frontend
npm install
npm run dev
```

### Backend

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Notes

- The API base URL is automatically configured for both development and production environments
- Static assets are configured with proper caching headers
- Security headers are added to all responses

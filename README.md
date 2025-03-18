# Bonstart

A starter application for building within the Bonterra Platform, demonstrating AWS native serverless web application building. This project is built using [SST](https://sst.dev) with a Next.js frontend and serverless backend.

## Project Overview

Bonstart provides a foundation for developers to build scalable applications on the Bonterra Platform. It showcases serverless architecture patterns, API integrations, and modern frontend development practices to accelerate your development process.

## Architecture

This project is structured as a monorepo:

1. `packages/frontend/` - Next.js 15 application with Chakra UI v3
2. `packages/functions/` - AWS Lambda functions for serverless API endpoints
3. `packages/core/` - Shared code and utilities used across the project
4. `packages/scripts/` - Utility scripts for the application

## Infrastructure

The `infra/` directory contains the infrastructure defined using SST constructs:

- `api.ts` - API Gateway configuration for backend endpoints
- `storage.ts` - S3 bucket and database configurations
- `frontend.ts` - Next.js site configuration

## Getting Started

### Prerequisites

- Node.js v20.x or later
- npm v9.x or later
- AWS account and configured AWS CLI

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your own values:
   ```
   AWS_PROFILE=your-aws-profile-name
   ```

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bonstart.git
   cd bonstart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start local development environment, frontend and backend:
   ```bash
   npx sst dev
   ```

   Optionally, start only the frontend:
   ```bash
   cd packages/frontend
   npm run dev
   ```

4. Access the frontend at [http://localhost:3000](http://localhost:3000)

### Deployment

Deploy to AWS using SST:

```bash
# Production stage
npx sst deploy --stage production
```

## API Endpoints

| Method | Endpoint      | Description                       |
|--------|---------------|-----------------------------------|
| GET    | /             | Health check endpoint             |
| GET    | /resources    | Retrieve example resource data    |

## Frontend

The frontend is built with:

- Next.js 15
- Chakra UI v3
- React 19

## Additional Information

- The API URL is automatically passed to the frontend during deployment
- Static assets are deployed to AWS CloudFront for optimal delivery
- Database interactions will be handled through serverless functions (Not yet built)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---


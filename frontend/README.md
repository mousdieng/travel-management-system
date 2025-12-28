# Travel Management System - Frontend

A comprehensive Angular-based frontend application for the Travel Management System, featuring role-based access control and modern UI/UX design.

## Features

### User Roles
- **Admin**: Full system management, analytics, user and travel oversight
- **Manager**: Create and manage travel packages, view subscribers and analytics
- **Traveler**: Browse travels, make bookings, leave feedback, view recommendations

### Key Features
- JWT-based authentication with automatic token refresh
- Role-based routing and UI components
- Elasticsearch-powered travel search
- Neo4j-powered travel recommendations
- Responsive design with TailwindCSS
- Material Design components
- Real-time notifications
- Advanced analytics and reporting

## Technology Stack

- **Framework**: Angular 17 (Standalone Components)
- **Styling**: TailwindCSS + Angular Material
- **State Management**: RxJS
- **HTTP Client**: Angular HttpClient with Interceptors
- **Forms**: Reactive Forms
- **Routing**: Angular Router with Guards
- **Charts**: Chart.js + ng2-charts
- **Notifications**: ngx-toastr
- **Date Handling**: date-fns
- **Authentication**: JWT with jwt-decode

## Project Structure

```
src/
├── app/
│   ├── core/                    # Core functionality
│   │   ├── constants/          # API endpoints, roles
│   │   ├── guards/             # Auth, role guards
│   │   ├── interceptors/       # JWT, error interceptors
│   │   ├── models/             # TypeScript interfaces
│   │   └── services/           # API services
│   ├── features/               # Feature modules
│   │   ├── admin/              # Admin dashboard & management
│   │   ├── auth/               # Login & registration
│   │   ├── manager/            # Manager dashboard & travels
│   │   └── traveler/           # Browse, book, feedback
│   ├── shared/                 # Shared components
│   │   └── components/         # Navbar, footer, modal, etc.
│   ├── app.component.ts        # Root component
│   ├── app.config.ts           # App configuration
│   └── app.routes.ts           # Route definitions
├── assets/                     # Static assets
├── environments/               # Environment configs
└── styles.css                  # Global styles
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
   - Update `src/environments/environment.ts` with your API URL
   - Default API URL: `http://localhost:8080`

### Development

Run development server:
```bash
npm start
```

Navigate to `http://localhost:4200`

Run with SSL:
```bash
npm run start:ssl
```

### Building

Production build:
```bash
npm run build:prod
```

Build output: `dist/travel-management-frontend/`

### Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Docker Deployment

### Build Docker image:
```bash
npm run docker:build
```

### Run Docker container:
```bash
npm run docker:run
```

Or use docker-compose from the root project:
```bash
docker-compose up frontend
```

## API Integration

All API calls go through the gateway at `http://localhost:8080`:

- **Auth**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Travels**: `/api/travels/*`
- **Subscriptions**: `/api/subscriptions/*`
- **Payments**: `/api/payments/*`
- **Feedbacks**: `/api/feedbacks/*`
- **Reports**: `/api/reports/*`
- **Dashboard**: `/api/dashboard/*`

## Routing

### Public Routes
- `/` - Home page
- `/travels` - Browse travels
- `/travels/:id` - Travel detail
- `/auth/login` - Login
- `/auth/register` - Register

### Protected Routes (with role guards)

**Admin**:
- `/admin/dashboard` - Admin dashboard
- `/admin/travels` - Travel management
- `/admin/users` - User management
- `/admin/analytics` - Analytics
- `/admin/reports` - Reports

**Manager**:
- `/manager/dashboard` - Manager dashboard
- `/manager/travels` - My travels
- `/manager/subscribers` - Subscribers
- `/manager/analytics` - Analytics

**Traveler**:
- `/traveler/subscriptions` - My trips
- `/traveler/feedbacks` - My reviews
- `/traveler/profile` - Profile
- `/traveler/payments` - Payments
- `/traveler/recommendations` - Recommendations

## Code Style

Format code:
```bash
npm run format
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on the repository.

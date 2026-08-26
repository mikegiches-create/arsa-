# ARSA Real Estate Backend

A production-ready Node.js/Express backend for the ARSA Real Estate platform with PostgreSQL, Prisma ORM, JWT authentication, and comprehensive CRUD operations.

## Features

✨ **Core Features**
- JWT-based authentication with access and refresh tokens
- Role-Based Access Control (Admin/User)
- Complete CRUD APIs for all entities
- PostgreSQL database with Prisma ORM
- Advanced property search with filtering, sorting, and pagination
- Input validation and error handling
- Activity logging and audit trails
- Rate limiting and security middleware
- RESTful API architecture

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **HTTP Client:** axios
- **Logging:** morgan
- **Security:** helmet, express-rate-limit, CORS

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL database

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and update:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Your JWT secret key
- `JWT_REFRESH_SECRET` - Your refresh token secret
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Frontend URL

3. **Set up the database:**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. **Start the development server:**
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build TypeScript
npm start           # Start production server

# Database
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:seed       # Seed database with sample data
npm run prisma:studio     # Open Prisma Studio

# Code Quality
npm run lint        # Run ESLint
npm run format      # Format with Prettier
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register a new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `POST /refresh-token` - Refresh access token
- `GET /me` - Get current user profile

### Users (`/api/users`)
- `GET /` - List all users (admin only)
- `GET /:id` - Get user by ID
- `PUT /profile` - Update current user profile
- `POST /change-password` - Change password
- `GET /saved-properties` - Get saved properties
- `DELETE /:id` - Delete user (admin only)

### Properties (`/api/properties`)
- `GET /` - List properties with filters
- `GET /featured` - Get featured properties
- `GET /:id` - Get property details
- `POST /` - Create property
- `PUT /:id` - Update property
- `DELETE /:id` - Delete property
- `POST /save` - Save/unsave property

### Categories (`/api/categories`)
- `GET /` - List categories
- `GET /:id` - Get category with properties
- `POST /` - Create category (admin)
- `PUT /:id` - Update category (admin)
- `DELETE /:id` - Delete category (admin)

### Locations (`/api/locations`)
- `GET /` - List locations
- `GET /:id` - Get location with properties
- `POST /` - Create location (admin)
- `PUT /:id` - Update location (admin)
- `DELETE /:id` - Delete location (admin)

### Testimonials (`/api/testimonials`)
- `GET /` - List testimonials
- `GET /:id` - Get testimonial
- `POST /` - Create testimonial
- `PUT /:id` - Update testimonial
- `DELETE /:id` - Delete testimonial
- `PATCH /:id/featured` - Toggle featured (admin)

### Messages (`/api/messages`)
- `POST /` - Send contact message
- `GET /` - List all messages (admin)
- `GET /:id` - Get message (admin)
- `PATCH /:id/status` - Update message status (admin)
- `DELETE /:id` - Delete message (admin)
- `GET /unread-count` - Get unread count (admin)

### Appointments (`/api/appointments`)
- `POST /` - Create appointment
- `GET /` - List appointments
- `GET /:id` - Get appointment
- `PUT /:id` - Update appointment
- `DELETE /:id` - Cancel appointment

### Settings (`/api/settings`)
- `GET /` - List all settings
- `GET /:key` - Get setting by key
- `PUT /:key` - Update setting (admin)
- `PUT /` - Update multiple settings (admin)
- `DELETE /:key` - Delete setting (admin)

## Demo Credentials

### Admin Account
- **Email:** admin@arsarealestate.com
- **Password:** Admin@123

### Regular User
- **Email:** buyer1@example.com
- **Password:** User@123

## Database Schema

The database includes the following tables:

- **User** - User accounts with profiles
- **Property** - Real estate listings
- **Category** - Property categories (Apartment, House, Villa, etc.)
- **Location** - Property locations/cities
- **Agent** - Real estate agents
- **Testimonial** - User reviews and testimonials
- **SavedProperty** - Bookmarked properties
- **Message** - Contact form inquiries
- **Appointment** - Property viewing appointments
- **Settings** - Website configuration
- **MediaFile** - Uploaded media files
- **ActivityLog** - Admin action audit logs

## Authentication Flow

1. **Login:** POST `/api/auth/login` with email and password
2. **Response:** Returns `accessToken` and `refreshToken`
3. **Protected Requests:** Include token in Authorization header:
   ```
   Authorization: Bearer <accessToken>
   ```
4. **Token Refresh:** POST `/api/auth/refresh-token` with `refreshToken`
5. **Logout:** POST `/api/auth/logout` (optional)

## Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Pagination

List endpoints support pagination with query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Response format:
```json
{
  "success": true,
  "message": "Success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasMore": true
  }
}
```

## Search & Filtering

Properties support advanced search:
- `search` - Search in title, description, address, city
- `categoryId` - Filter by category
- `locationId` - Filter by location
- `status` - Filter by status
- `type` - Filter by property type
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order: asc or desc (default: desc)

Example:
```
GET /api/properties?search=luxury&locationId=1&minPrice=100000&maxPrice=500000&limit=10
```

## Rate Limiting

API is rate-limited to prevent abuse:
- **Window:** 15 minutes
- **Max Requests:** 100 per window
- **Rate Limit Headers:** Returns `X-RateLimit-*` headers

## Security

- **CORS:** Configured for frontend origin
- **Helmet:** Sets security HTTP headers
- **bcryptjs:** Password hashing with salt rounds
- **JWT:** Secure token-based authentication
- **Validation:** Input validation on all endpoints
- **Error Messages:** Generic messages in production

## Deployment

### Environment Setup for Production

Update `.env` with production values:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@prod-host:5432/arsa_prod
JWT_SECRET=<strong-random-secret>
```

### Build and Run

```bash
npm run build
npm start
```

### Using Docker (Optional)

```bash
docker build -t arsa-backend .
docker run -p 5000:5000 --env-file .env arsa-backend
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists: `createdb arsa_realestate`

### Migration Errors
```bash
npm run prisma:migrate -- --name fix_schema
```

### Clear Database
```bash
npm run prisma:migrate -- reset
```

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server startup
│   ├── config/             # Configuration files
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Custom middleware
│   ├── routes/             # API routes
│   ├── validators/         # Input validators
│   ├── utils/              # Utility functions
│   └── lib/               # Libraries (Prisma client)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Seed data
├── .env                    # Environment variables
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
└── README.md             # This file
```

## Future Enhancements

- [ ] Email notifications
- [ ] File upload (Cloudinary/S3)
- [ ] Payment integration (Stripe)
- [ ] Advanced analytics
- [ ] API documentation (Swagger)
- [ ] WebSocket support for real-time updates
- [ ] GraphQL API alternative
- [ ] Caching layer (Redis)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT - See LICENSE file

## Support

For issues and questions:
- Email: support@arsarealestate.com
- GitHub Issues: [arsa-realestate/backend/issues](https://github.com/arsa-realestate/backend/issues)

---

Built with ❤️ by ARSA Real Estate Team

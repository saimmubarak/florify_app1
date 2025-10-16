# Florify Simplified Architecture Guide

## 🏗️ Architecture Overview

The application has been simplified to focus on core garden management functionality:

### Backend (AWS Lambda + DynamoDB)
- **Authentication**: Cognito User Pools for user management
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Individual functions for each operation
- **DynamoDB**: Single table for garden data storage
- **No S3**: Removed image storage for now

### Frontend (React)
- **Authentication**: Login/Signup with Cognito
- **Garden Management**: Create, view, edit, delete gardens
- **Routing**: React Router for navigation
- **API Integration**: Axios for backend communication

## 📊 Database Schema

### DynamoDB Table: `florify-auth-gardens-dev`

| Attribute | Type | Description |
|-----------|------|-------------|
| `userId` | String (Partition Key) | Cognito user ID |
| `gardenId` | String (Sort Key) | Unique garden identifier |
| `name` | String | Garden name |
| `location` | String | Garden location |
| `description` | String | Garden description (optional) |
| `createdAt` | String | Creation timestamp |
| `updatedAt` | String | Last update timestamp |

## 🔧 API Endpoints

### Authentication Endpoints
- `POST /signup` - Create new user account
- `POST /login` - Authenticate user
- `POST /confirm` - Confirm email verification
- `POST /resend` - Resend confirmation code

### Garden Endpoints
- `POST /gardens` - Create new garden
- `GET /gardens` - Get all user's gardens
- `GET /gardens/{gardenId}` - Get specific garden
- `PUT /gardens/{gardenId}` - Update garden
- `DELETE /gardens/{gardenId}` - Delete garden

## 🚀 Deployment Instructions

### 1. Deploy Backend
```bash
cd /workspace/backend
./deploy_simplified.sh
```

### 2. Test Endpoints
```bash
./test_garden_endpoints.sh
```

### 3. Start Frontend
```bash
cd /workspace/florify-frontend
npm install
npm run dev
```

## 🧪 Testing the Application

### 1. Test User Flow
1. **Signup**: Create a new user account
2. **Email Confirmation**: Confirm email (check console for code)
3. **Login**: Login with confirmed account
4. **Create Garden**: Add a new garden
5. **View Gardens**: See list of gardens
6. **Edit Garden**: Click on garden to edit details
7. **Delete Garden**: Remove garden from list

### 2. Test API Endpoints
```bash
# Create garden
curl -X POST https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/gardens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Garden",
    "location": "123 Main St",
    "description": "A beautiful garden"
  }'

# Get gardens
curl -X GET https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/gardens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 Authentication Flow

1. **User Signs Up**: Frontend calls `/signup` endpoint
2. **Email Confirmation**: User receives email with confirmation code
3. **Confirm Account**: Frontend calls `/confirm` endpoint
4. **Login**: Frontend calls `/login` endpoint
5. **JWT Token**: Backend returns JWT token
6. **API Calls**: Frontend includes JWT in Authorization header

## 📱 Frontend Components

### Pages
- `LoginPage.jsx` - User login
- `SignupPage.jsx` - User registration
- `EmailConfirmationPage.jsx` - Email verification
- `LandingPage.jsx` - Main dashboard with garden list
- `GardenDetailPage.jsx` - Individual garden view/edit

### Components
- `CreateGardenForm.jsx` - Garden creation form
- `SimpleCreateGardenWizard.jsx` - Simplified garden wizard
- `GardenCard.jsx` - Garden display card
- `Button.jsx` - Reusable button component
- `InputField.jsx` - Reusable input component

### API Services
- `auth.js` - Authentication API calls
- `gardens.js` - Garden CRUD operations
- `location.js` - Location services (placeholder)

## 🗺️ Location API Integration

The location API is prepared for future integration with:

### Google Maps
```javascript
import { initializeGoogleMaps, geocodeAddress } from '../api/location';

// Initialize Google Maps
const maps = await initializeGoogleMaps('YOUR_API_KEY');

// Geocode address
const coords = await geocodeAddress('123 Main St, New York');
```

### Mapbox
```javascript
import { initializeMapbox, reverseGeocode } from '../api/location';

// Initialize Mapbox
const mapbox = await initializeMapbox('YOUR_ACCESS_TOKEN');

// Reverse geocode coordinates
const address = await reverseGeocode(40.7128, -74.0060);
```

## 🔍 Troubleshooting

### Common Issues

1. **"Network error" during signup**
   - Check if Lambda functions are deployed
   - Verify API Gateway URL in frontend
   - Check CloudWatch logs

2. **"Invalid or missing authentication token"**
   - Ensure user is logged in
   - Check JWT token in localStorage
   - Verify token hasn't expired

3. **Garden operations fail**
   - Check DynamoDB table exists
   - Verify IAM permissions
   - Check Lambda function logs

### Debug Commands

```bash
# Check deployment status
serverless info --config serverless_simplified.yml --stage dev

# View Lambda logs
serverless logs -f create-garden --stage dev

# Test specific endpoint
curl -X GET https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/hello
```

## 🚀 Next Steps

### Immediate Improvements
1. **JWT Verification**: Implement proper JWT token verification
2. **Error Handling**: Add comprehensive error handling
3. **Loading States**: Improve UI loading indicators
4. **Form Validation**: Add client-side validation

### Future Features
1. **Image Upload**: Add S3 integration for garden photos
2. **Location Services**: Integrate with Google Maps/Mapbox
3. **Garden Templates**: Pre-defined garden layouts
4. **Plant Database**: Integration with plant information APIs
5. **Weather Integration**: Local weather data for gardens
6. **Social Features**: Share gardens with other users

### Performance Optimizations
1. **Caching**: Implement Redis for frequently accessed data
2. **CDN**: Use CloudFront for static assets
3. **Database Indexing**: Add GSI for complex queries
4. **Lambda Optimization**: Cold start optimization

## 📚 Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [React Router Documentation](https://reactrouter.com/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
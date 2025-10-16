# 🌱 Florify - Garden Management Application

A simple React frontend with AWS Lambda backend for managing personal gardens.

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured: `aws configure`
- Serverless Framework: `npm install -g serverless@3.38.0`
- Node.js and npm installed

### 1. Deploy Backend
```bash
cd backend
serverless deploy --stage dev
```

### 2. Update Frontend API URL
After deployment, update the API URL in:
- `florify-frontend/src/api/auth.js`
- `florify-frontend/src/api/gardens.js`

### 3. Start Frontend
```bash
cd florify-frontend
npm install
npm run dev
```

## 🔧 Architecture

### Backend (AWS)
- **Lambda Functions**: Individual functions for each operation
- **API Gateway**: RESTful API endpoints
- **DynamoDB**: Garden data storage
- **Cognito**: User authentication

### Frontend (React)
- **Authentication**: Login/Signup with Cognito
- **Garden Management**: Create, view, edit, delete gardens
- **Routing**: React Router for navigation

## 📊 API Endpoints

### Authentication
- `POST /signup` - Create new user account
- `POST /login` - Authenticate user
- `POST /confirm` - Confirm email verification
- `POST /resend` - Resend confirmation code

### Gardens
- `POST /gardens` - Create new garden
- `GET /gardens` - Get all user's gardens
- `GET /gardens/{gardenId}` - Get specific garden
- `PUT /gardens/{gardenId}` - Update garden
- `DELETE /gardens/{gardenId}` - Delete garden

## 🧪 Testing

### Test Backend
```bash
# Test signup
curl -X POST https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'

# Test gardens
curl -X POST https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/gardens \
  -H "Content-Type: application/json" \
  -d '{"name":"My Garden","location":"123 Main St","description":"A beautiful garden"}'
```

### Test Frontend
1. Open `http://localhost:5173`
2. Sign up for a new account
3. Confirm email (check console for code)
4. Login with your account
5. Create and manage gardens

## 🔍 Troubleshooting

### Common Issues

**"Network error" during signup**
- Check if Lambda functions are deployed
- Verify API Gateway URL in frontend
- Check CloudWatch logs

**CORS errors**
- Backend has CORS enabled
- Check API Gateway CORS settings
- Verify frontend is calling correct API URL

**"Invalid or missing authentication token"**
- Ensure user is logged in
- Check JWT token in localStorage
- Verify token hasn't expired

### Debug Commands
```bash
# Check deployment status
serverless info --stage dev

# View Lambda logs
serverless logs -f signup --stage dev

# Test specific endpoint
curl -X GET https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/hello
```

## 📁 File Structure
```
/workspace/
├── backend/
│   ├── serverless.yml          # Serverless configuration
│   ├── signup_handler.py       # User signup
│   ├── login_handler.py        # User login
│   ├── confirm_handler.py      # Email confirmation
│   ├── resend_handler.py       # Resend confirmation
│   ├── create_garden_handler.py # Create garden
│   ├── get_gardens_handler.py  # Get all gardens
│   ├── get_garden_handler.py   # Get specific garden
│   ├── update_garden_handler.py # Update garden
│   ├── delete_garden_handler.py # Delete garden
│   └── handler.py              # Hello endpoint
└── florify-frontend/
    ├── src/
    │   ├── api/
    │   │   ├── auth.js         # Authentication API
    │   │   └── gardens.js      # Garden API
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── LandingPage.jsx
    │   │   └── GardenDetailPage.jsx
    │   └── components/
    │       ├── CreateGardenForm.jsx
    │       └── SimpleCreateGardenWizard.jsx
    └── package.json
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

## 🆘 Support

If you encounter issues:
1. Check AWS CloudFormation console for stack errors
2. Review CloudWatch logs for specific error messages
3. Verify all environment variables are correctly set
4. Ensure Cognito User Pool is properly configured

## 🧹 Cleanup

To remove all resources:
```bash
cd backend
serverless remove --stage dev
```
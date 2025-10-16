# 🧪 Frontend Testing Guide

## ✅ **Backend is Working!**
Your API endpoints are live and working:
- **API Base URL**: `https://jiazehdrvf.execute-api.eu-north-1.amazonaws.com/dev`
- **Hello endpoint**: ✅ Working
- **Signup endpoint**: ✅ Working  
- **Gardens endpoint**: ✅ Working

## 🚀 **Start the Frontend**

1. **Navigate to frontend directory**:
   ```bash
   cd /workspace/florify-frontend
   ```

2. **Install dependencies** (if not done):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to the URL shown (usually `http://localhost:5173`)

## 🔧 **What I Fixed**

### ✅ **API URLs Updated**
- Updated `auth.js` with your API URL
- Updated `gardens.js` with your API URL

### ✅ **Navigation Fixed**
- Fixed LoginPage to use React Router (`useNavigate`, `Link`)
- Fixed SignupPage to use React Router
- Removed old `onNavigate` system

### ✅ **Authentication Flow**
- Login now uses the new `login()` function from `auth.js`
- Signup now uses the new `signup()` function from `auth.js`
- Proper token storage in localStorage

## 🧪 **Test the Application**

### 1. **Test Navigation**
- Go to login page
- Click "Sign up" link → Should navigate to signup page
- Click "Log in" link → Should navigate back to login page

### 2. **Test Signup**
- Fill out signup form
- Click "Sign Up" → Should show success message
- Should navigate to confirmation page

### 3. **Test Login**
- Use the same email/password from signup
- Click "Login" → Should show success message
- Should navigate to landing page

### 4. **Test Gardens**
- On landing page, click "Create Garden"
- Fill out garden form
- Submit → Should create garden and show in list
- Click on a garden card → Should navigate to detail page

## 🐛 **If Something Doesn't Work**

### **Check Browser Console**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any red error messages
4. Check Network tab for failed requests

### **Common Issues**
- **"Unable to connect to server"**: Check if API URL is correct
- **Navigation not working**: Check if React Router is properly installed
- **CORS errors**: Backend has CORS enabled, should work

### **Debug Steps**
1. **Check API URL**: Make sure both `auth.js` and `gardens.js` have the correct URL
2. **Check network**: Look at Network tab in DevTools
3. **Check console**: Look for JavaScript errors
4. **Test with curl**: Use the curl commands to test backend directly

## 📱 **Expected Flow**

1. **Start** → Login page
2. **Sign up** → Fill form → Success → Confirmation page
3. **Login** → Fill form → Success → Landing page
4. **Create garden** → Fill form → Success → Garden appears in list
5. **Click garden** → Navigate to detail page
6. **Edit garden** → Update form → Success → Changes saved

The application should now work end-to-end! 🎉
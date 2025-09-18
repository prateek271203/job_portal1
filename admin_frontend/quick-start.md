# 🚀 Quick Start Guide - Admin Frontend

Get your admin dashboard running in minutes!

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
cd admin_frontend
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. Open Browser
Navigate to: `http://localhost:3000`

### 4. Login
Use the demo credentials:
- **Email**: `admin@jobportal.com`
- **Password**: `admin123456`

## 🔧 Prerequisites

- ✅ Node.js 16+ installed
- ✅ Admin backend running on port 5001
- ✅ MongoDB running locally

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution**: 
1. Ensure admin backend is running: `cd ../admin_backend && npm run dev`
2. Check if backend is accessible: `http://localhost:5001/health`

### Issue: "Login failed"
**Solution**:
1. Verify admin user exists: `cd ../admin_backend && npm run create-admin`
2. Check MongoDB connection
3. Verify JWT_SECRET in backend .env

### Issue: "CORS error"
**Solution**:
1. Check backend CORS configuration
2. Ensure frontend proxy is set to `http://localhost:5001`
3. Restart both frontend and backend

## 📱 Features Overview

- **Dashboard**: Real-time statistics and charts
- **User Management**: Add, edit, delete users
- **Job Management**: Manage job postings
- **Company Management**: Handle company profiles
- **Analytics**: Detailed insights and reports

## 🔗 Useful Links

- [Full Documentation](README.md)
- [Backend Setup](../admin_backend/README.md)
- [API Endpoints](../admin_backend/README.md#api-endpoints)

## 💡 Tips

- Use browser DevTools to debug API calls
- Check Network tab for failed requests
- Monitor Console for error messages
- Use React DevTools for component debugging

## 🆘 Need Help?

1. Check the troubleshooting section in README.md
2. Review browser console for errors
3. Verify backend connectivity
4. Check environment configuration

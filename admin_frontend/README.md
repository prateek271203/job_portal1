# Admin Frontend - Job Portal

A modern, responsive React-based admin dashboard for managing the Job Portal platform.

## 🚀 Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Real-time Updates**: Live data updates and notifications
- **Role-based Access**: Different views based on admin permissions
- **Responsive Design**: Works perfectly on all devices
- **Dark/Light Mode**: Toggle between themes
- **Advanced Charts**: Interactive data visualization with Recharts
- **Toast Notifications**: User-friendly feedback system
- **Form Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

- **Frontend**: React 18 with Hooks
- **Routing**: React Router v6
- **State Management**: React Context API
- **Styling**: CSS3 with modern features
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts for data visualization
- **Icons**: React Icons
- **Notifications**: React Hot Toast
- **Tables**: React Table v7

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Admin backend running on port 5001

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd admin_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=http://localhost:5001" > .env
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5001` |

### Proxy Configuration

The frontend is configured to proxy API requests to the backend:

```json
{
  "proxy": "http://localhost:5001"
}
```

## 🎨 UI Components

### Core Components

- **Login**: Secure authentication form
- **Dashboard**: Overview with statistics and charts
- **Sidebar**: Navigation with role-based menu items
- **Users**: User management interface
- **Jobs**: Job posting management
- **Companies**: Company management
- **Categories**: Job category management
- **FAQs**: FAQ management
- **Content**: Dynamic content management

### Design Features

- **Gradient Text**: Modern gradient text effects
- **Glass Morphism**: Translucent card designs
- **Smooth Animations**: CSS transitions and animations
- **Responsive Grid**: Flexible layout system
- **Color Themes**: Consistent color palette
- **Typography**: Modern font hierarchy

## 🔐 Authentication

### Login Flow

1. User enters credentials
2. Form validation (client-side)
3. API request to backend
4. JWT token storage
5. Redirect to dashboard
6. Token validation on each request

### Protected Routes

- All admin routes require authentication
- Automatic redirect to login if not authenticated
- Token refresh mechanism
- Secure logout with token cleanup

## 📊 Dashboard Features

### Statistics Overview

- Total users, jobs, companies, applications
- Monthly growth metrics
- Real-time data updates
- Interactive charts and graphs

### Data Visualization

- **Line Charts**: Time-series data
- **Bar Charts**: Category comparisons
- **Pie Charts**: Distribution data
- **Area Charts**: Trend analysis

## 🎯 User Experience

### Loading States

- Skeleton loaders for content
- Spinner animations
- Progress indicators
- Disabled states during operations

### Error Handling

- User-friendly error messages
- Toast notifications
- Form validation feedback
- Network error handling

### Responsive Design

- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interactions
- Adaptive navigation

## 🚀 Performance

### Optimization Features

- **Code Splitting**: Lazy loading of components
- **Memoization**: React.memo for expensive components
- **Debounced Search**: Optimized search functionality
- **Virtual Scrolling**: For large data tables
- **Image Optimization**: Compressed and optimized images

### Best Practices

- Functional components with hooks
- Proper dependency arrays
- Memoized callbacks
- Efficient re-renders
- Bundle size optimization

## 🧪 Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Development Tools

- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **React DevTools**: Component debugging
- **Redux DevTools**: State management debugging

## 🚀 Deployment

### Build Process

1. **Optimize build**
   ```bash
   npm run build
   ```

2. **Test production build**
   ```bash
   npm install -g serve
   serve -s build
   ```

3. **Deploy to hosting service**
   - Netlify, Vercel, or traditional hosting
   - Configure environment variables
   - Set up custom domain

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure API URL for production
- [ ] Enable HTTPS
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Set up monitoring and analytics

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify backend CORS configuration
   - Check API URL in environment
   - Ensure backend is running

2. **Authentication Issues**
   - Check JWT token storage
   - Verify backend authentication
   - Clear localStorage and retry

3. **Build Errors**
   - Check Node.js version
   - Clear node_modules and reinstall
   - Verify environment variables

4. **Performance Issues**
   - Check bundle size
   - Optimize images and assets
   - Enable code splitting

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Use functional components with hooks
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for complex functions

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the browser console for errors
- Verify backend connectivity

## 🔗 Links

- **Backend API**: [Admin Backend](../admin_backend/README.md)
- **Main Portal**: [Job Portal](../job_portal/README.md)
- **API Documentation**: Backend README
- **Live Demo**: [Coming Soon]

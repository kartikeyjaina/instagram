# Instagram 2.0 - Frontend

Beautiful authentication pages for Instagram 2.0 built with React and modern styling.

## Features

- **Login Page**: Clean and intuitive login interface with email/password authentication
- **Registration Page**: Comprehensive signup with form validation
- **Social Login**: Google and Facebook login buttons (UI ready)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient background and smooth animations
- **API Integration**: Fully integrated with backend authentication APIs
- **Error Handling**: Comprehensive form validation and error messages
- **Token Management**: Automatic JWT token storage and retrieval

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:5173`

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx          # Login page component
│   ├── Register.jsx       # Registration page component
├── styles/
│   ├── global.css         # Global styles
│   ├── App.css            # App container styles
│   └── Auth.css           # Authentication pages styles
├── api/
│   └── authService.js     # API service for authentication
├── App.jsx                # Main app component
└── main.jsx               # Entry point
```

## API Endpoints

The frontend communicates with the following backend endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

## Authentication Flow

1. User fills in the form
2. Form is validated client-side
3. API request is sent to backend
4. Token is stored in localStorage on success
5. User is redirected to dashboard

## Local Storage

- `token` - JWT token for authenticated requests
- `user` - User information (id, username, email)
- `rememberMe` - Remember me preference

## Customization

### Colors
To change the color scheme, modify the gradient colors in:
- `src/styles/global.css` - Background gradient
- `src/styles/Auth.css` - Primary button gradient

Current gradient: `#667eea` to `#764ba2` (Purple to Violet)

### API Base URL
To change the API endpoint, modify in `src/api/authService.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000/api/auth'
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Preview Production Build

```bash
npm run preview
```

# Best Equipment OS - Mobile App

React Native mobile application for Best Equipment OS using Expo.

## Features

- User authentication with JWT tokens
- Real-time fleet tracking and vehicle monitoring
- Job dispatch and management
- Maintenance scheduling
- Bottom tab navigation for intuitive UI
- Responsive design for iOS and Android

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for development)

## Installation

```bash
cd apps/mobile
npm install
```

## Development

Start the development server:

```bash
npm start
```

For specific platforms:
- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`

## Environment Setup

Copy `.env.example` to `.env` and update with your API URL:

```bash
cp .env.example .env
```

## Project Structure

```
src/
├── api/           # API client and services
├── screens/       # Screen components
├── navigation/    # Navigation setup
├── stores/        # Zustand state management
├── components/    # Reusable components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── types/         # TypeScript type definitions
```

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Technologies Used

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Zustand
- **API Client**: Axios
- **Styling**: StyleSheet (React Native)
- **Icons**: Ionicons

## API Integration

The app communicates with the Best Equipment OS backend API. Ensure the backend is running and the API URL is correctly configured in your `.env` file.

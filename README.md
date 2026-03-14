# Student Attendance App

A modern student attendance management system built with **Expo (React Native)** and **Supabase**.

## 🚀 Features

- **Authentication:** Secure login and registration powered by Supabase Auth.
- **Role-based Access:** Different interfaces for Students, Mentors, Proctors, and HODs.
- **Attendance Tracking:** Real-time attendance marking and history.
- **Dashboard:** Statistics and visual insights into attendance data.
- **Cross-Platform:** Works on iOS, Android, and Web.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing)

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/srikanthsajja3/college-application.git
   cd college-application
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🚀 Running the App

Start the development server:

```bash
npm start
```

In the terminal, you can choose:
- Press `i` for **iOS simulator**
- Press `a` for **Android emulator**
- Press `w` for **Web**
- Scan the **QR code** with the Expo Go app on your phone to run it on a physical device.

## 🏗️ Project Structure

- `app/` - Expo Router file-based navigation.
- `components/` - Reusable UI components.
- `hooks/` - Custom React hooks (e.g., `useAuth`).
- `lib/` - Third-party library configurations (Supabase client).
- `constants/` - Theme and configuration constants.

## 📄 License

This project is licensed under the MIT License.

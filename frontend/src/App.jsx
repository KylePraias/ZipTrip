// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CreateTrip from './pages/CreateTrip';
import Dashboard from './pages/Dashboard';
import TripDetails from './pages/TripDetails';
import Login from './pages/Login';
import Navbar from './components/Navbar'; // ✅ AuthButton is inside this now
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

const App = () => (
  <AuthProvider>
    <Router>
      <div className="p-4">
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <Navigate to="/create" replace />
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/create"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <CreateTrip />
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <Dashboard />
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/trip/:tripId"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <TripDetails />
                </>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  </AuthProvider>
);

export default App;

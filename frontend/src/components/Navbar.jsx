import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Navbar() {
  const { user } = useAuth();

  const handleLogout = () => {
    signOut(auth).catch(err => console.error("Logout error:", err));
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              ZipTrip
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/create" 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Create Trip
            </Link>
            <Link 
              to="/dashboard" 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              My Trips
            </Link>
            
            {/* User Section */}
            {user && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-500 hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  data-testid="logout-btn"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

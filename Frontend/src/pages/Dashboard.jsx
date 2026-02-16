import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserTrips, deleteTrip } from '../api/firestore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTrips = async () => {
    if (user) {
      try {
        const tripsData = await getUserTrips();
        setTrips(tripsData);
      } catch (err) {
        console.error('Error fetching trips:', err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const handleDelete = async (e, tripId, tripName) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete your trip to ${tripName}?`)) {
      return;
    }

    setDeletingId(tripId);
    try {
      await deleteTrip(tripId);
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (err) {
      console.error('Error deleting trip:', err);
      alert('Failed to delete trip');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-red-500 text-lg">Please log in to view your trips.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Trips</h1>
          <p className="text-gray-600">Your travel adventures at a glance</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading your trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No trips yet</h3>
            <p className="text-gray-500 mb-6">Start planning your next adventure!</p>
            <Link
              to="/create"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
            >
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 group relative"
                data-testid={`trip-card-${trip.id}`}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, trip.id, trip.destination)}
                  disabled={deletingId === trip.id}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  data-testid={`delete-trip-${trip.id}`}
                  title="Delete trip"
                >
                  {deletingId === trip.id ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

                <Link to={`/trip/${trip.id}`} className="block">
                  <div className="flex items-start justify-between mb-4 pr-8">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {trip.destination}
                    </h3>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full font-medium">
                      {trip.purpose}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {trip.dateRange}
                  </p>
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-sm text-blue-500 font-medium group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Create Trip Button (when has trips) */}
        {trips.length > 0 && (
          <div className="text-center mt-10">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Plan Another Trip
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

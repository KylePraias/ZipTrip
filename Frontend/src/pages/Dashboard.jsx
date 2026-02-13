import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserTrips } from '../api/firestore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      if (user) {
        const tripsData = await getUserTrips();
        setTrips(tripsData);
      }
    };
    fetch();
  }, [user]);

  if (!user) return <p className="text-center mt-10 text-red-500">Please log in to view your trips.</p>;

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-[#007FFF] mb-10">Your Trips</h2>
        {trips.length === 0 ? (
          <p className="text-center text-gray-600">No trips found. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trips.map(trip => (
              <Link
                to={`/trip/${trip.id}`}
                key={trip.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-5 hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="text-xl font-semibold text-[#CC5500]">{trip.destination}</h3>
                <p className="text-gray-600 text-sm mb-1">{trip.purpose}</p>
                <p className="text-gray-500 text-xs mb-3">{trip.dateRange}</p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>👜 Pack luggage</li>
                  <li>✈️ Book flights</li>
                  <li>📄 Print documents</li>
                </ul>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

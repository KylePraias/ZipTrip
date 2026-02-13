import React, { useEffect, useState } from 'react';
import { getUserTrips } from '../api/firestore';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const TripList = () => {
  const [user] = useAuthState(auth);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const userTrips = await getUserTrips();
        setTrips(userTrips);
      } catch (err) {
        console.error('Error fetching trips:', err);
        setMessage('❌ Failed to load trips.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user]);

  if (!user) return <p className="text-center mt-10">Please log in to view your trips.</p>;
  if (loading) return <p className="text-center mt-10">Loading trips...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">Your Trips</h2>
      {message && <p className="text-sm text-center">{message}</p>}

      {trips.length === 0 ? (
        <p className="text-center">You have no saved trips.</p>
      ) : (
        trips.map((trip) => (
          <div
            key={trip.id}
            className="border p-4 rounded shadow space-y-2 bg-white"
          >
            <h3 className="text-xl font-semibold">{trip.destination}</h3>
            <p><strong>Purpose:</strong> {trip.purpose}</p>
            <p><strong>Dates:</strong> {trip.dateRange}</p>

            <Link
              to={`/trip/${trip.id}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              View Checklist
            </Link>
          </div>
        ))
      )}
    </div>
  );
};

export default TripList;

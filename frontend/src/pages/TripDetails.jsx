import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTripById, updateChecklist } from '../api/firestore';

const TripDetails = () => {
  const { tripId } = useParams();
  console.log("Trip ID from URL:", tripId);
  const [trip, setTrip] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const data = await getTripById(tripId);
        setTrip(data);
        setChecklist(data.checklist || []);
      } catch (err) {
        console.error('Error fetching trip:', err);
        setMessage('❌ Failed to load trip details.');
      }
    };
    fetchTrip();
  }, [tripId]);

  const toggleItem = async (sectionIndex, itemIndex) => {
    const updated = [...checklist];
    updated[sectionIndex].items[itemIndex].checked = !updated[sectionIndex].items[itemIndex].checked;
    setChecklist(updated);
    try {
      await updateChecklist(tripId, updated);
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  if (!trip && !message) return <p className="text-center mt-10">Loading trip details...</p>;
  if (message) return <p className="text-center mt-10 text-red-500">{message}</p>;


  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded space-y-6 shadow">
      <h2 className="text-2xl font-bold mb-4">{trip.destination} Trip</h2>
      <p><strong>Purpose:</strong> {trip.purpose}</p>
      <p><strong>Dates:</strong> {trip.dateRange}</p>

      {checklist.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Packing Checklist</h3>
          {checklist.map((section, i) => (
            <div key={i} className="mb-4">
              <p className="font-semibold text-lg mb-1">{section.category}</p>
              <ul className="space-y-1 ml-4">
                {section.items.map((item, j) => (
                  <li key={j}>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(i, j)}
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {message && <p className="text-sm mt-2 text-center">{message}</p>}
    </div>
  );
};

export default TripDetails;

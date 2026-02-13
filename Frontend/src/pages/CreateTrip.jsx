import { useEffect, useRef, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { addTrip } from '../api/firestore';
import { loadGoogleMapsScript } from '../utils/loadGoogleMaps';

export default function CreateTrip() {
  const [user] = useAuthState(auth);
  const [form, setForm] = useState({
    destination: '',
    purpose: 'Leisure',
    startDate: '',
    endDate: '',
  });
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const [checklist, setChecklist] = useState([]);
  const [tripId, setTripId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [activities, setActivities] = useState([]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve(); // Already loaded
          return;
        }
  
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }&libraries=places`;
        script.async = true;
        script.defer = true;
  
        script.onload = resolve;
        script.onerror = reject;
  
        document.head.appendChild(script);
      });
    };
  
    loadGoogleMapsScript(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)  // Use your API key here
    .then(() => {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        let destination = place.name;

        if (place.formatted_address) {
          const parts = place.formatted_address.split(',');
          destination = parts[0].replace(/^\d{4,6}\s*/, '').trim();
        }

        setForm((prevForm) => ({ ...prevForm, destination }));
      });
    })
    .catch((err) => {
      console.error('Failed to load Google Maps:', err);
    });
  }, []);
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { destination, startDate, endDate, purpose } = form;

    if (!destination || !startDate || !endDate) {
      setMessage('❌ Please fill all fields.');
      return;
    }

    try {
      const dateRange = `${startDate} to ${endDate}`;
      const id = await addTrip({ destination, purpose, dateRange });
      setTripId(id);
      setMessage(`✅ Trip saved.`);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to save trip.');
    }
  };

  const getIcon = (title) => {
    const key = title.toLowerCase();
    if (key.includes('clothing')) return '👕';
    if (key.includes('essential')) return '💳';
    if (key.includes('toiletries')) return '🧼';
    if (key.includes('tech')) return '📱';
    return '🧳';
  };

  const handleGeminiChecklist = async () => {
    if (!tripId) {
      setMessage('❌ Please save the trip first before generating the checklist.');
      return;
    }
    

    const { destination, startDate, endDate, purpose } = form;
    const dateRange = `${startDate} to ${endDate}`;

    try {
      const response = await fetch('http://localhost:8989/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, dateRange, purpose, weather: 'Mild' }),
      });

      const data = await response.json();

      if (data.activities) {
        const suggestions = data.activities
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        setActivities(suggestions);
      }

      if (data.checklist) {
        const lines = data.checklist.split('\n').filter(line => line.trim() !== '');
        const parsed = [];
        let currentSection = null;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (
            trimmed.toLowerCase().includes('packing list') ||
            trimmed.endsWith(':') ||
            trimmed.endsWith(':**') ||
            trimmed.includes('**')
          ) {
            currentSection = {
              title: trimmed.replace(/\*+|:$/g, '').trim(),
              items: [],
            };
            parsed.push(currentSection);
          } else if (currentSection) {
            currentSection.items.push({
              label: trimmed.replace(/^[-*•\d.]+/, '').trim(),
              checked: false,
            });
          }
        }

        setChecklist(parsed);
        setExpandedSections(parsed.reduce((acc, section, i) => {
          acc[i] = true;
          return acc;
        }, {}));
        setMessage('✅ Checklist generated!');
      } else {
        setMessage('❌ No checklist returned.');
      }
    } catch (err) {
      console.error('Gemini error:', err);
      setMessage('❌ Failed to fetch checklist.');
    }
  };

  const handleGeminiActivities = async () => {
    if (!form.destination) {
      setMessage('❌ Destination is required for suggestions.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:8989/api/gemini-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: form.destination }),
      });
  
      const data = await response.json();
      if (data.suggestions) {
        const suggestions = data.suggestions
          .split('\n')
          .map(line =>
            line
              .replace(/^[-*•\d.]+/, '')         // remove bullets or numbers
              .replace(/\*\*/g, '')              // remove all **
              .trim()
          )
          
          .filter(Boolean);
  
        setActivities(suggestions);
        setMessage('✅ Activity suggestions generated!');
      } else {
        setMessage('❌ No suggestions returned.');
      }
    } catch (err) {
      console.error('Gemini activities error:', err);
      setMessage('❌ Failed to fetch activity suggestions.');
    }
  };
  

  const canSuggestActivities = () => {
    return form.destination && form.startDate && form.endDate && tripId;
  };
  
  
  const resetChecklist = () => {
    setChecklist([]);
    setExpandedSections({});
    setMessage('');
  };

  const resetActivities = () => {
    setActivities([]);
    setMessage('');
  };
  

  if (!user) return <p className="text-center mt-10 text-red-500">Please log in to create a trip.</p>;

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-4xl w-full p-6 bg-white rounded-lg shadow-lg space-y-6">
        <h2 className="text-4xl font-bold text-center text-[#007FFF]">Plan Your Trip ✈️</h2>
        <h2 className="text-2xl text-center text-black">Where The Function @!!!</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            name="destination"
            placeholder="Destination"
            value={form.destination}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
          />

          <div className="flex gap-4">
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-1/2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007FFF]"
            />
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="w-1/2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007FFF]"
            />
          </div>

          <select
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007FFF]"
          >
            <option value="Leisure">Leisure</option>
            <option value="Business">Business</option>
            <option value="Adventure">Adventure</option>
            <option value="Family">Family</option>
          </select>

          <button
            type="submit"
            className="w-full bg-[#CC5500] text-white p-3 rounded-md font-medium hover:bg-orange-700 transition"
          >
            Save Trip
          </button>
        </form>

        <button
          type="button"
          onClick={handleGeminiChecklist}
          className={`w-full p-3 rounded-md font-medium transition ${
            tripId ? 'bg-[#007FFF] text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!tripId}
        >
          Generate Checklist
        </button>

        <button
  type="button"
  onClick={handleGeminiActivities}
  className={`w-full p-3 rounded-md font-medium transition ${
    canSuggestActivities()
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
  disabled={!canSuggestActivities()}
>
  Suggest Activities 🌍
</button>



        <p onClick={resetChecklist} className="text-sm text-blue-600 hover:underline text-center cursor-pointer">
          Reset Checklist
        </p>

        <p onClick={resetActivities} className="text-sm text-blue-600 hover:underline text-center cursor-pointer">
          Reset Activities
        </p>


        {message && <p className="text-center text-sm text-gray-700">{message}</p>}

        {(checklist.length > 0 || activities.length > 0) && (
        <div className="flex flex-col md:flex-row gap-6 mt-6">
        {checklist.length > 0 && (
          <div className="w-full md:w-1/2 p-6 bg-gray-50 border border-gray-200 rounded-md mt-6">
            <h3 className="font-semibold mb-4 text-[#007FFF] text-xl">Checklist</h3>
            <div className="space-y-6">
              {checklist.map((section, idx) => (
                <div key={idx}>
                  <div
                    onClick={() => setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="cursor-pointer mb-2 flex justify-between items-center"
                  >
                    <h4 className="text-lg font-bold text-gray-800">
                      {getIcon(section.title)} {section.title}
                    </h4>
                    <span className="text-sm text-[#007FFF]">{expandedSections[idx] ? '−' : '+'}</span>
                  </div>
                  {expandedSections[idx] && (
                    <ul className="space-y-3 pl-2">
                      {section.items.map((item, i) => (
                        <li key={i}>
                          <label className="flex items-center gap-3 text-gray-800">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => {
                                const updated = [...checklist];
                                updated[idx].items[i].checked = !updated[idx].items[i].checked;
                                setChecklist(updated);
                              }}
                              className="h-5 w-5 accent-[#007FFF]"
                            />
                            <span className="text-base">{item.label}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {activities.length > 0 && (
  <div className="w-full md:w-1/2 p-6 bg-gray-100 border border-gray-300 rounded-md mt-6">
    <h3 className="font-semibold mb-4 text-green-700 text-xl">Activity Suggestions</h3>
    <div className="space-y-4">
  <h4 className="text-2xl font-bold text-green-800 mb-2">{form.destination}</h4>
  <ul className="pl-6 space-y-2 text-gray-800">
  {activities.map((activity, idx) => (
    <li key={idx} className="before:content-['•'] before:mr-2 before:text-lg">{activity}</li>
  ))}
</ul>

</div>

  </div>
)}
</div>
)}

      </div>
    </div>
  );
}








import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { addTrip } from '../api/firestore';

export default function CreateTrip() {
  const [user] = useAuthState(auth);
  const [form, setForm] = useState({
    destination: '',
    purpose: 'Leisure',
    startDate: '',
    endDate: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [checklist, setChecklist] = useState([]);
  const [tripId, setTripId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState({ checklist: false, activities: false });
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    if (type === 'success') {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Fetch city suggestions from Google Places API (New)
  const fetchSuggestions = useCallback(
    debounce(async (input) => {
      if (!input || input.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not configured');
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({
            input: input,
            includedPrimaryTypes: ['locality', 'administrative_area_level_1'],
            languageCode: 'en',
          }),
        });

        const data = await response.json();
        
        if (data.suggestions) {
          const cities = data.suggestions
            .filter(s => s.placePrediction)
            .map(s => ({
              // Use full text for destination (e.g., "London, Ontario, Canada")
              fullText: s.placePrediction.text.text,
              mainText: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text.text,
              secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
              placeId: s.placePrediction.placeId,
            }));
          setSuggestions(cities);
          setShowSuggestions(cities.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, destination: value }));
    fetchSuggestions(value);
  };

  const selectSuggestion = (suggestion) => {
    // Use the full text (e.g., "London, Ontario, Canada") for the destination
    setForm((prev) => ({ ...prev, destination: suggestion.fullText }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Date validation - update end date min when start date changes
  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setForm((prev) => {
      // If end date is before new start date, reset it
      if (prev.endDate && prev.endDate < value) {
        return { ...prev, startDate: value, endDate: '' };
      }
      return { ...prev, startDate: value };
    });
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, endDate: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { destination, startDate, endDate, purpose } = form;

    if (!destination || !startDate || !endDate) {
      showMessage('Please fill all fields.', 'error');
      return;
    }

    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      showMessage('End date cannot be before start date.', 'error');
      return;
    }

    try {
      const dateRange = `${startDate} to ${endDate}`;
      const id = await addTrip({ destination, purpose, dateRange });
      setTripId(id);
      showMessage('Trip saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showMessage('Failed to save trip.', 'error');
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
      showMessage('Please save the trip first.', 'error');
      return;
    }

    const { destination, startDate, endDate, purpose } = form;
    const dateRange = `${startDate} to ${endDate}`;

    setLoading(prev => ({ ...prev, checklist: true }));
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, dateRange, purpose, weather: 'Mild' }),
      });

      const data = await response.json();

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
        showMessage('Checklist generated!', 'success');
      } else {
        showMessage('No checklist returned.', 'error');
      }
    } catch (err) {
      console.error('Gemini error:', err);
      showMessage('Failed to fetch checklist.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, checklist: false }));
    }
  };

  const handleGeminiActivities = async () => {
    if (!form.destination) {
      showMessage('Destination is required.', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, activities: true }));
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/gemini-activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: form.destination }),
      });

      const data = await response.json();
      
      if (data.activities && data.format === 'structured') {
        setActivities(data.activities);
        showMessage('Activity suggestions generated!', 'success');
      } else if (data.suggestions) {
        const suggestions = data.suggestions
          .split('\n')
          .map(line => line.replace(/^[-*•\d.]+/, '').replace(/\*\*/g, '').trim())
          .filter(Boolean);
        setActivities(suggestions.map(s => ({ name: s, description: '' })));
        showMessage('Activity suggestions generated!', 'success');
      } else {
        showMessage('No suggestions returned.', 'error');
      }
    } catch (err) {
      console.error('Gemini activities error:', err);
      showMessage('Failed to fetch activity suggestions.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };

  const canSuggestActivities = () => {
    return form.destination && form.startDate && form.endDate && tripId;
  };

  const resetAll = () => {
    setChecklist([]);
    setActivities([]);
    setExpandedSections({});
    setMessage('');
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-red-500 text-lg">Please log in to create a trip.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Plan Your Trip</h1>
          <p className="text-gray-600">Create your perfect travel itinerary with AI-powered suggestions</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination Input with Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where are you going?
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  name="destination"
                  placeholder="Search for a city..."
                  value={form.destination}
                  onChange={handleDestinationChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                  data-testid="destination-input"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.placeId || index}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-800">{suggestion.mainText}</div>
                        {suggestion.secondaryText && (
                          <div className="text-sm text-gray-500">{suggestion.secondaryText}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleStartDateChange}
                  min={today}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  data-testid="start-date-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleEndDateChange}
                  min={form.startDate || today}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  data-testid="end-date-input"
                />
              </div>
            </div>

            {/* Purpose Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Purpose
              </label>
              <select
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                data-testid="purpose-select"
              >
                <option value="Leisure">🏖️ Leisure</option>
                <option value="Business">💼 Business</option>
                <option value="Adventure">🏔️ Adventure</option>
                <option value="Family">👨‍👩‍👧‍👦 Family</option>
              </select>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
              data-testid="save-trip-btn"
            >
              Save Trip
            </button>
          </form>

          {/* AI Generation Buttons */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGeminiChecklist}
              disabled={!tripId || loading.checklist}
              className={`py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                tripId && !loading.checklist
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              data-testid="generate-checklist-btn"
            >
              {loading.checklist ? (
                <span className="animate-pulse">Generating...</span>
              ) : (
                <>📋 Generate Checklist</>
              )}
            </button>

            <button
              type="button"
              onClick={handleGeminiActivities}
              disabled={!canSuggestActivities() || loading.activities}
              className={`py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                canSuggestActivities() && !loading.activities
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              data-testid="suggest-activities-btn"
            >
              {loading.activities ? (
                <span className="animate-pulse">Generating...</span>
              ) : (
                <>🌍 Suggest Activities</>
              )}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-4 rounded-xl text-center font-medium ${
              messageType === 'success' ? 'bg-green-50 text-green-700' :
              messageType === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}

          {/* Reset Button */}
          {(checklist.length > 0 || activities.length > 0) && (
            <button
              onClick={resetAll}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline w-full text-center"
              data-testid="reset-btn"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Results Section */}
        {(checklist.length > 0 || activities.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checklist Card */}
            {checklist.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  📋 Packing Checklist
                </h3>
                <div className="space-y-4">
                  {checklist.map((section, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-semibold text-gray-800 flex items-center gap-2">
                          {getIcon(section.title)} {section.title}
                        </span>
                        <span className="text-blue-500 text-xl">
                          {expandedSections[idx] ? '−' : '+'}
                        </span>
                      </button>
                      {expandedSections[idx] && (
                        <ul className="p-4 space-y-3">
                          {section.items.map((item, i) => (
                            <li key={i}>
                              <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => {
                                    const updated = [...checklist];
                                    updated[idx].items[i].checked = !updated[idx].items[i].checked;
                                    setChecklist(updated);
                                  }}
                                  className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <span className={`text-gray-700 group-hover:text-gray-900 ${
                                  item.checked ? 'line-through text-gray-400' : ''
                                }`}>
                                  {item.label}
                                </span>
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

            {/* Activities Card */}
            {activities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  🌍 Things to Do
                </h3>
                <p className="text-gray-500 mb-6">in {form.destination}</p>
                <div className="space-y-4">
                  {activities.map((activity, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all"
                    >
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {typeof activity === 'string' ? activity : activity.name}
                      </h4>
                      {activity.description && (
                        <p className="text-gray-600 mt-1 text-sm">{activity.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

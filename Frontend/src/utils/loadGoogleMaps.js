export const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
  
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
  
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
  
      document.head.appendChild(script);
    });
  };
  
// API configuration
// In production, VITE_API_URL should be set to your backend URL (e.g., https://your-backend.up.railway.app)
// In development, leave it empty to use Vite's proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  if (API_BASE_URL) {
    // Production: use full URL from environment variable
    // Ensure no double slashes
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    return `${base}/${cleanEndpoint}`;
  } else {
    // Development: use relative URL (Vite proxy handles it)
    return `/${cleanEndpoint}`;
  }
};

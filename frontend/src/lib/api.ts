// Helper utility for making authenticated requests to the backend
// Les requêtes passent par le proxy Next.js (configuré dans next.config.ts)
// ce qui évite les erreurs CORS.

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('ga_auth_token');
  
  const headers = new Headers(options.headers);
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Prepend API URL if defined, otherwise use relative path (passing by Next.js proxy)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.warn("Session expirée ou non autorisée");
    }
    // Essayer de lire le message d'erreur du backend
    let errorMessage = response.statusText;
    try {
      const errData = await response.json();
      errorMessage = errData.detail || errorMessage;
    } catch { /* ignore */ }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * API utility for fetching data with a pre-configured base URL and common headers.
 * Inspired by Next.js fetch patterns.
 */

export const BASE_URL = 'https://staging-data.moonbot.id/moon_office';

/**
 * Custom fetch wrapper for Moon Office API
 * @param {string} path - The API endpoint path (e.g., '/login')
 * @param {Object} options - Standard fetch options
 * @returns {Promise<any>} - JSON response
 */
export async function fetchApi(path, options = {}) {
    const { 
        headers = {}, 
        body, 
        ...customOptions 
    } = options;

    const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const token = localStorage.getItem('moon_office_token');

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
    };

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (token && !normalizedPath.startsWith('/login')) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Auto-stringify body if it's an object and not already a string
    let formattedBody = body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
        formattedBody = JSON.stringify(body);
    }

    try {
        if (window.Sentry) {
            Sentry.addBreadcrumb({
                category: 'api',
                message: `Request: ${path}`,
                level: 'info',
                data: {
                    method: customOptions.method || 'GET',
                    url: url
                }
            });
        }

        const response = await fetch(url, {
            ...customOptions,
            headers: defaultHeaders,
            body: formattedBody,
        });

        if (window.Sentry) {
            Sentry.addBreadcrumb({
                category: 'api',
                message: `Response: ${path} [${response.status}]`,
                level: response.ok ? 'info' : 'warning',
                data: {
                    status: response.status,
                    ok: response.ok
                }
            });
        }

        // Basic error handling
        if (!response.ok) {
            if (response.status === 401 && !normalizedPath.startsWith('/login') && !normalizedPath.startsWith('/otp')) {
                localStorage.removeItem('moon_office_token');
                window.location.hash = '#/login';
            }
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
            error.status = response.status;
            error.data = errorData;
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    extra: {
                        path,
                        status: response.status,
                        errorData
                    }
                });
            }
            
            throw error;
        }

        // Return JSON by default
        return await response.json();
    } catch (error) {
        console.error(`API Fetch Error [${url}]:`, error);
        
        if (window.Sentry && !(error.status)) { // Only capture if not already captured above or if it's a network error
            Sentry.captureException(error, {
                extra: { path, url }
            });
        }
        
        throw error;
    }
}

export default fetchApi;

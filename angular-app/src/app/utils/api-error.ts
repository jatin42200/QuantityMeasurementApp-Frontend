export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const response = error as {
    error?: unknown;
    status?: number;
    message?: string;
  };

  if (typeof response.error === 'string') return response.error;

  if (response.error && typeof response.error === 'object') {
    const apiError = response.error as {
      error?: string;
      message?: string;
      details?: string;
    };

    if (apiError.error) return apiError.error;
    if (apiError.message) return apiError.message;
    if (apiError.details) return apiError.details;
  }

  if (typeof response.message === 'string') return response.message;

  if (response.status === 0) {
    return 'Cannot reach the backend. Make sure the Spring Boot server is running on http://localhost:8080.';
  }

  return fallback;
}

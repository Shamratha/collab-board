// Lightweight typed error so controllers can `throw new ApiError(404, '...')`
// and the central error handler turns it into a clean JSON response.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

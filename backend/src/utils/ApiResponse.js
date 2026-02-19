/**
 * Standardised success response wrapper.
 * Every successful API response goes through this class
 * so the client always receives a predictable shape.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (2xx)
   * @param {string} message    - Success message
   * @param {*}      [data]     - Payload
   */
  constructor(statusCode, message, data = null) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;

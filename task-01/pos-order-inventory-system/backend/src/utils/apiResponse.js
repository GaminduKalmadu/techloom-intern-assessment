class ApiResponse {
  /**
   * @param {boolean} success - Operation status
   * @param {string} message - Response message
   * @param {any} data - Payload data
   * @param {object|null} meta - Pagination or supplementary metadata
   */
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
    if (meta !== null) {
      this.meta = meta;
    }
  }

  static success(res, message = 'Success', data = null, statusCode = 200, meta = null) {
    return res.status(statusCode).json(new ApiResponse(true, message, data, meta));
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return res.status(201).json(new ApiResponse(true, message, data));
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;

class ApiResponse {
  static success(res, message = 'Success', data = null, statusCode = 200, meta = null) {
    const payload = {
      success: true,
      message,
    };

    if (data !== null) payload.data = data;
    if (meta !== null) payload.meta = meta;

    return res.status(statusCode).json(payload);
  }

  static error(res, message = 'Error', statusCode = 500, errors = null, code = null) {
    const payload = {
      success: false,
      message,
    };

    if (errors) payload.errors = errors;
    if (code) payload.code = code;

    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIResponse = void 0;
class APIResponse {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }
    static error(res, message = 'Error', statusCode = 400, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }
    static serverError(res, error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}
exports.APIResponse = APIResponse;

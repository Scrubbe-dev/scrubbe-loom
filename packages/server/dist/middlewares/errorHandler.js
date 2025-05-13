"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
const errorHandler = (err, req, res, next) => {
    if (err instanceof error_1.APIError) {
        logger_1.logger.error(`API Error: ${err.message}`);
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }
    logger_1.logger.error(`Unhandled Error: ${err.message}`);
    console.error(err.stack);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;

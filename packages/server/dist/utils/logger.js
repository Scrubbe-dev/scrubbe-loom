"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config/config");
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const level = () => {
    return config_1.config.isDevelopment ? 'debug' : 'warn';
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const transports = [
    new winston_1.default.transports.Console(),
    new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }),
    new winston_1.default.transports.File({ filename: 'logs/all.log' }),
];
exports.logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
// Handle uncaught exceptions and promise rejections
process.on('uncaughtException', (error) => {
    exports.logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
        exports.logger.error(`Unhandled Rejection: ${reason.message}`);
    }
    else {
        exports.logger.error(`Unhandled Rejection: ${reason}`);
    }
});

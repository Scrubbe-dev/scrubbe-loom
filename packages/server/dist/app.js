"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const routes_1 = require("./routes");
const errorHandler_1 = require("./middlewares/errorHandler");
// config()
exports.app = (0, express_1.default)();
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: config_1.config.clientUrl,
    credentials: true,
}));
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((req, res, next) => {
    logger_1.logger.info(`[${req.method}] ${req.path}`);
    next();
});
exports.app.use('/api', routes_1.router);
exports.app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});
exports.app.use(errorHandler_1.errorHandler);

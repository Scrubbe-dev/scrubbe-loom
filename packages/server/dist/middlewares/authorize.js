"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeUser = exports.authorizeCustomer = exports.authorizeAdmin = exports.authorize = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../utils/error");
const authorize = (options) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new error_1.ForbiddenError('Authentication required');
            }
            let roles = [];
            let allowSameUser = false;
            let paramId = 'id';
            if (Array.isArray(options)) {
                roles = options;
            }
            else {
                roles = options.roles || [];
                allowSameUser = options.allowSameUser || false;
                paramId = options.paramId || 'id';
            }
            // Check if user has one of the required roles
            const hasRole = roles.length === 0 || roles.includes(req.user.role);
            // Check if user is accessing their own resource
            const isSameUser = allowSameUser && req.params[paramId] === req.user.id;
            if (!hasRole && !isSameUser) {
                throw new error_1.ForbiddenError('Insufficient permissions');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
// Convenience functions for common roles
exports.authorizeAdmin = (0, exports.authorize)([client_1.Role.ADMIN]);
exports.authorizeCustomer = (0, exports.authorize)([client_1.Role.CUSTOMER]);
exports.authorizeUser = (0, exports.authorize)([client_1.Role.USER]);

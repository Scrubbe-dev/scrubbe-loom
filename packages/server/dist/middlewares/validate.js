"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const error_1 = require("../utils/error");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof Error) {
                next(new error_1.ValidationError([], error.message));
            }
            else {
                next(new error_1.ValidationError());
            }
        }
    };
};
exports.validate = validate;

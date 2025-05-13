import { Response } from 'express';

export class APIResponse {
  static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message: string = 'Error', statusCode: number = 400, errors: any = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static serverError(res: Response, error: Error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
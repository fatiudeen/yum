import { Response } from "express";
import httpStatus from "http-status";

export class HttpResponse {
  static send(res: Response, data: object, status = 200) {
    res.status(status);

    if ("limit" in data) {
      return res.json({
        success: true,
        message: httpStatus[status],
        ...data,
      });
    }
    return res.json({
      success: true,
      message: httpStatus[status],
      data,
    });
  }
}

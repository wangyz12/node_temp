// src/types/global/express.ts
import { Request, Response, NextFunction } from 'express';

// 定义Express相关类型
export type ExpressRequest = Request;
export type ExpressResponse = Response;
export type ExpressNext = NextFunction;

export type Controller = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => any;

export type AsyncController = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNext
) => Promise<any>;

// 可以继续添加其他Express相关类型
export type Middleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => void;

export type ErrorMiddleware = (
  err: any,
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNext
) => void;

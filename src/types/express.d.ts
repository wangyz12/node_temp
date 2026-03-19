// src/types/express.d.ts
import { NextFunction, Request, Response } from 'express';

export interface ExpressRequest extends Request {}
export interface ExpressResponse extends Response {}
export interface ExpressNextFunction extends NextFunction {}

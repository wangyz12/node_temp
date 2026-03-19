// src/types/express.d.ts
import { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        account: string;
        username?: string;
        deptId?: string;
        isSuperAdmin?: boolean;
        [key: string]: any;
      };
      dataScope?: {
        deptIds: string[];
        dataScope: string;
        deptAlias: string;
        userAlias: string;
      };
      userPermissions?: {
        menus: any[];
        permissions: string[];
        dataScope: {
          deptIds: string[];
          dataScope: string;
        };
      };
    }
  }
}

export interface ExpressRequest extends Request {}
export interface ExpressResponse extends Response {}
export interface ExpressNextFunction extends NextFunction {}

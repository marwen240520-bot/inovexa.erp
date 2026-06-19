// Type definitions for request user
declare global {
  namespace Express {
    interface Request {
      user: {
        userId: number;
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export {};

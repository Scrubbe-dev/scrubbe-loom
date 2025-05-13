// types/express/index.d.ts
declare global {
    namespace Express {
      interface User {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
        customerId?: string;
      }
  
      interface Request {
        user?: User;
      }
    }
  }
  export {};
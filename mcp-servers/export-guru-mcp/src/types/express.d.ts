declare module 'express' {
  export interface Request {
    [key: string]: any;
  }
  
  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    [key: string]: any;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export interface Express {
    use: any;
    get: any;
    post: any;
    put: any;
    delete: any;
    [key: string]: any;
  }
  
  function express(): Express;
  
  namespace express {
    export function json(): any;
    export function urlencoded(options: { extended: boolean }): any;
    export function static(path: string): any;
  }
  
  export default express;
} 
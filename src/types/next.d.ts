// Override Next.js route parameters type
declare module 'next/dist/build/templates/app-route' {
  interface RouteModule {
    GET?: (request: Request, context: { params: Record<string, string> }) => Promise<Response>;
    HEAD?: (request: Request, context: { params: Record<string, string> }) => Promise<Response>;
    OPTIONS?: (request: Request, context: { params: Record<string, string> }) => Promise<Response>;
    POST?: (request: Request, context: { params: Record<string, string> }) => Promise<Response>;
    PUT?: (request: Request, context: { params: Record<string, string> }) => Promise<Response>;
    DELETE?: (request: Request, context: { params: Record<string, string> }) => Promise<Response>;
    PATCH?: (request: Request, context: { params: Record<string, string> }) => Promise<Response>;
  }
} 
declare module 'json-server' {
  import type { Router } from 'express';
  const jsonServer: {
    router: (source: string) => Router;
  };
  export default jsonServer;
}

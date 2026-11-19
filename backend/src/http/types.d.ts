declare global {
  namespace Express {
    interface Request {
      playerId?: string;
      requestId?: string;
      accountEmail?: string;
      sessionToken?: string;
      sessionExpiresAt?: string;
    }
  }
}
export {};

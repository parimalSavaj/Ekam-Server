/** Identity attached to a request by AuthMiddleware.requireSession(). Always derived from the session, never from client input. */
export type AuthenticatedUser = {
  userId: string;
};

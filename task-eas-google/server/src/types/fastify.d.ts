import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: number;
      email: string;
      type: 'access';
    };
    user: {
      sub: number;
      email: string;
      type: 'access';
    };
  }
}

// Extend FastifyRequest to include our custom user property
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: {
      id: number;
      email: string;
    };
  }
}

declare module 'svix' {
  export class Webhook {
    constructor(secret: string);
    verify(payload: string, headers: Record<string, any>): any;
  }
}

declare module 'socket.io' {
  export interface Server {
    to(room: string): { emit: (event: string, payload: any) => void };
    emit(event: string, payload: any): void;
  }
  export interface Socket {
    handshake: { query: Record<string, any> };
    join(room: string): void;
    leave(room: string): void;
  }
}

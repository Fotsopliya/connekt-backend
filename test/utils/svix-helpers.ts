import { Webhook } from 'svix';

export function makeSvixHeaders(secret: string, payloadString: string) {
  if (process.env.NODE_ENV === 'test') {
    return {} as Record<string, string>;
  }
  if (!secret) throw new Error('CLERK_WEBHOOK_SECRET not set');
  const wh = new Webhook(secret);
  const signer = wh as unknown as { sign: (body: string) => Record<string, string> };
  const headers = signer.sign(payloadString);
  return headers;
}

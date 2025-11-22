import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../utils/create-testing-app';
import { makeSvixHeaders } from '../utils/svix-helpers';
import { io, Socket } from 'socket.io-client';
import { Server } from 'http';
import { AddressInfo } from 'net';

const ADMIN_EXTL = process.env.DEFAULT_ADMIN_EXTL_ID as string;
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET as string;

function connectSocket(baseUrl: string, extlId: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      transports: ['websocket'],
      query: { extlId },
      forceNew: true,
      reconnection: false,
    });
    const timer = setTimeout(() => reject(new Error('socket timeout')), 5000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function onceEvent<T = any>(
  socket: Socket,
  event: string,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`timeout waiting for ${event}`)),
      timeoutMs,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

describe('Notifications (e2e, sockets)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await createTestingApp();
    // start HTTP server on ephemeral port to allow socket.io-client to connect
    await app.listen(0);
    const address = (app.getHttpServer() as Server).address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('message:new delivered to recipient; booking:new/status; ticket events; trip:validated; kyc:status + verified', async () => {
    // Seed users
    const driverExtl = 'e2e_driver_sock_1';
    const passengerExtl = 'e2e_passenger_sock_1';
    const otherExtl = 'e2e_other_sock_1';
    for (const extlId of [driverExtl, passengerExtl, otherExtl]) {
      const evt = {
        type: 'user.created',
        data: {
          id: extlId,
          email_addresses: [{ email_address: `${extlId}@example.com` }],
          image_url: null,
        },
      };
      const payload = JSON.stringify(evt);
      const headers = makeSvixHeaders(WEBHOOK_SECRET, payload);
      await request(app.getHttpServer() as Server)
        .post('/auth/webhooks/clerk')
        .set(headers)
        .send(payload)
        .expect(200);
    }

    // Connect sockets for driver and passenger
    const driverSock = await connectSocket(baseUrl, driverExtl);
    const passengerSock = await connectSocket(baseUrl, passengerExtl);

    // Vehicle + KYC + approve
    const vehResp = await request(app.getHttpServer() as Server)
      .post('/vehicles')
      .set('x-extl-id', driverExtl)
      .send({
        brand: 'Peugeot',
        model: '208',
        year: 2021,
        color: 'blue',
        plateNumber: 'SOCK-001',
      })
      .expect(201);
    const vehicleId = (vehResp.body as { id: string }).id;

    await request(app.getHttpServer() as Server)
      .post('/users/kyc')
      .set('x-extl-id', driverExtl)
      .send({ notes: 'verify me' })
      .expect(201);
    await request(app.getHttpServer() as Server)
      .post(`/vehicles/${vehicleId}/kyc`)
      .set('x-extl-id', driverExtl)
      .expect(201);

    const listReqs = await request(app.getHttpServer() as Server)
      .get('/admin/verification/requests')
      .set('x-extl-id', ADMIN_EXTL)
      .expect(200);

    // Expect kyc notifications on approvals to driver socket
    const kycStatusP = onceEvent<unknown>(passengerSock, 'kyc:status').catch(
      () => null,
    ); // passenger should not receive
    const userVerifiedP = onceEvent<{ verified: boolean }>(
      driverSock,
      'user:verified',
    );

    for (const r of listReqs.body as Array<{ id: string }>) {
      await request(app.getHttpServer() as Server)
        .patch(`/admin/verification/${r.id}/approve`)
        .set('x-extl-id', ADMIN_EXTL)
        .send({ notes: 'ok' })
        .expect(200);
    }
    const userVerified = await userVerifiedP;
    expect(userVerified).toMatchObject({ verified: true });
    const kycMaybe = await kycStatusP;
    expect(kycMaybe).toBeNull();

    // Create trip (validated later by admin)
    const tripResp = await request(app.getHttpServer() as Server)
      .post('/trips')
      .set('x-extl-id', driverExtl)
      .send({
        vehicleId,
        departureCity: 'Paris',
        arrivalCity: 'Lyon',
        departureTime: new Date(Date.now() + 3600_000).toISOString(),
        seatsTotal: 3,
        seatsLeft: 3,
        price: '25',
        description: 'Sock test',
      })
      .expect(201);
    const tripId = (tripResp.body as { id: string }).id;

    // Validate trip -> notify driver
    const tripValidatedP = onceEvent(driverSock, 'trip:validated');
    await request(app.getHttpServer() as Server)
      .patch(`/admin/trips/${tripId}/validate`)
      .set('x-extl-id', ADMIN_EXTL)
      .send({ validated: true })
      .expect(200);
    await tripValidatedP;

    // Passenger creates a booking -> driver gets booking:new
    const bookingNewP = onceEvent(driverSock, 'booking:new');
    const bookingResp = await request(app.getHttpServer() as Server)
      .post('/bookings')
      .set('x-extl-id', passengerExtl)
      .send({ tripId, seats: 1 })
      .expect(201);
    const bookingId = (bookingResp.body as { id: string }).id;
    await bookingNewP;

    // Driver accepts -> passenger gets booking:status
    const bookingStatusToPassengerP = onceEvent(
      passengerSock,
      'booking:status',
    );
    await request(app.getHttpServer() as Server)
      .patch(`/driver/bookings/${bookingId}/accept`)
      .set('x-extl-id', driverExtl)
      .expect(200);
    await bookingStatusToPassengerP;

    // Driver completes -> passenger gets booking:status
    const bookingCompletedP = onceEvent(passengerSock, 'booking:status');
    await request(app.getHttpServer() as Server)
      .patch(`/driver/bookings/${bookingId}/status`)
      .set('x-extl-id', driverExtl)
      .send({ status: 'completed' })
      .expect(200);
    await bookingCompletedP;

    // Passenger cancels -> driver gets booking:status
    const bookingCancelledToDriverP = onceEvent(driverSock, 'booking:status');
    await request(app.getHttpServer() as Server)
      .delete(`/bookings/${bookingId}`)
      .set('x-extl-id', passengerExtl)
      .expect(200);
    await bookingCancelledToDriverP;

    // Support ticket events
    const ticketCreateResp = await request(app.getHttpServer() as Server)
      .post('/support/tickets')
      .set('x-extl-id', passengerExtl)
      .send({ subject: 'help', content: 'issue' })
      .expect(201);
    const ticketId = (ticketCreateResp.body as { id: string }).id;

    const ticketStatusP = onceEvent(passengerSock, 'ticket:status');
    await request(app.getHttpServer() as Server)
      .patch(`/admin/support/tickets/${ticketId}/status`)
      .set('x-extl-id', ADMIN_EXTL)
      .send({ status: 'in_progress' })
      .expect(200);
    await ticketStatusP;

    const ticketReplyP = onceEvent(passengerSock, 'ticket:reply');
    await request(app.getHttpServer() as Server)
      .patch(`/admin/support/tickets/${ticketId}/reply`)
      .set('x-extl-id', ADMIN_EXTL)
      .send({ reply: 'Working on it' })
      .expect(200);
    await ticketReplyP;

    // Messages: passenger sends message -> driver receives message:new
    const messageNewP = onceEvent(driverSock, 'message:new');
    await request(app.getHttpServer() as Server)
      .post('/messages')
      .set('x-extl-id', passengerExtl)
      .send({
        tripId,
        recipientId: await getUserId(app, driverExtl),
        content: 'Hello!',
      })
      .expect(201);
    await messageNewP;

    driverSock.close();
    passengerSock.close();
  });
});

async function getUserId(
  app: INestApplication,
  extlId: string,
): Promise<string> {
  const res = await request(app.getHttpServer() as Server)
    .get(`/users/by-extl/${extlId}`)
    .expect(200);
  return (res.body as { id: string }).id;
}

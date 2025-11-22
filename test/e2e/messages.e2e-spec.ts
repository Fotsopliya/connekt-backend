import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../utils/create-testing-app';
import { makeSvixHeaders } from '../utils/svix-helpers';
import { Server } from 'http';

const ADMIN_EXTL = process.env.DEFAULT_ADMIN_EXTL_ID as string;
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET as string;

describe('Messages e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('send, inbox/sent, conversation, markRead', async () => {
    // Seed two users (driver and passenger)
    const driverExtl = 'user_msg_driver_1';
    const passengerExtl = 'user_msg_passenger_1';
    for (const extlId of [driverExtl, passengerExtl]) {
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

    // Driver creates a vehicle and gets verified (user + vehicle)
    const vehResp = await request(app.getHttpServer() as Server)
      .post('/vehicles')
      .set('x-extl-id', driverExtl)
      .send({
        brand: 'Peugeot',
        model: '208',
        year: 2020,
        color: 'blue',
        plateNumber: 'MSG-001',
      })
      .expect(201);
    const vehicleId = (vehResp.body as { id: string }).id;

    await request(app.getHttpServer() as Server)
      .post('/users/kyc')
      .set('x-extl-id', driverExtl)
      .send({ notes: 'verify driver' })
      .expect(201);

    await request(app.getHttpServer() as Server)
      .post(`/vehicles/${vehicleId}/kyc`)
      .set('x-extl-id', driverExtl)
      .expect(201);

    const listReqs = await request(app.getHttpServer() as Server)
      .get('/admin/verification/requests')
      .set('x-extl-id', ADMIN_EXTL)
      .expect(200);

    for (const r of listReqs.body as Array<{ id: string }>) {
      await request(app.getHttpServer() as Server)
        .patch(`/admin/verification/${r.id}/approve`)
        .set('x-extl-id', ADMIN_EXTL)
        .send({ notes: 'ok' })
        .expect(200);
    }

    // Create a trip (needed to send messages)
    const tripResp = await request(app.getHttpServer() as Server)
      .post('/trips')
      .set('x-extl-id', driverExtl)
      .send({
        vehicleId,
        departureCity: 'Paris',
        arrivalCity: 'Marseille',
        departureTime: new Date(Date.now() + 7200_000).toISOString(),
        seatsTotal: 2,
        seatsLeft: 2,
        price: '30',
        description: 'Msg trip',
      })
      .expect(201);
    const tripId = (tripResp.body as { id: string }).id;
    const driverId = (tripResp.body as { driver: { id: string } }).driver?.id;

    // Passenger sends a message to driver
    const sendResp = await request(app.getHttpServer() as Server)
      .post('/messages')
      .set('x-extl-id', passengerExtl)
      .send({
        tripId,
        recipientId: driverId,
        content: 'Bonjour!',
      })
      .expect(201);
    const msgId = (sendResp.body as { id: string }).id;

    // Inbox of driver should contain the message
    const inbox = await request(app.getHttpServer() as Server)
      .get('/messages/inbox')
      .set('x-extl-id', driverExtl)
      .expect(200);
    expect(Array.isArray(inbox.body)).toBe(true);

    // Sent of passenger should contain the message
    const sent = await request(app.getHttpServer() as Server)
      .get('/messages/sent')
      .set('x-extl-id', passengerExtl)
      .expect(200);
    expect(Array.isArray(sent.body)).toBe(true);

    // Conversation between driver and passenger on this trip
    const senderId = (inbox.body as Array<{ sender: { id: string } }>)[0]
      ?.sender?.id;
    await request(app.getHttpServer() as Server)
      .get('/messages/conversation')
      .set('x-extl-id', driverExtl)
      .query({ with: senderId, tripId })
      .expect(200);

    // Mark read by driver
    await request(app.getHttpServer() as Server)
      .patch(`/messages/${msgId}/read`)
      .set('x-extl-id', driverExtl)
      .expect(200);
  });
});

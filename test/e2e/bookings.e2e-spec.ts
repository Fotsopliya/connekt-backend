import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../utils/create-testing-app';
import { makeSvixHeaders } from '../utils/svix-helpers';

const ADMIN_EXTL = process.env.DEFAULT_ADMIN_EXTL_ID as string;
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET as string;

describe('Bookings e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('full flow: create booking, driver accept, passenger cancel, set status', async () => {
    // 1) Seed users via Clerk webhook (driver & passenger)
    const driverExtl = 'user_driver_1';
    const passengerExtl = 'user_passenger_1';
    for (const extlId of [driverExtl, passengerExtl]) {
      const evt = {
        type: 'user.created',
        data: { id: extlId, email_addresses: [{ email_address: `${extlId}@example.com` }], image_url: null },
      };
      const payload = JSON.stringify(evt);
      const headers = makeSvixHeaders(WEBHOOK_SECRET, payload);
      await request(app.getHttpServer())
        .post('/auth/webhooks/clerk')
        .set(headers)
        .send(payload)
        .expect(200);
    }

    // 2) Driver creates a vehicle
    const vehResp = await request(app.getHttpServer())
      .post('/vehicles')
      .set('x-extl-id', driverExtl)
      .send({ brand: 'Tesla', model: 'Model 3', year: 2022, color: 'black', plateNumber: 'TEST-001' })
      .expect(201);
    const vehicleId = vehResp.body.id as string;

    // 3) Driver requests KYC for user and vehicle, admin approves both
    await request(app.getHttpServer())
      .post('/users/kyc')
      .set('x-extl-id', driverExtl)
      .send({ notes: 'verify me' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/kyc`)
      .set('x-extl-id', driverExtl)
      .expect(201);

    const listReqs = await request(app.getHttpServer())
      .get('/admin/verification/requests')
      .set('x-extl-id', ADMIN_EXTL)
      .expect(200);

    // Approve all pending requests for simplicity in this flow
    for (const r of listReqs.body as Array<{ id: string }>) {
      await request(app.getHttpServer())
        .patch(`/admin/verification/${r.id}/approve`)
        .set('x-extl-id', ADMIN_EXTL)
        .send({ notes: 'ok' })
        .expect(200);
    }

    // 4) Driver creates a trip (now verified)
    const tripResp = await request(app.getHttpServer())
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
        description: 'Test trip',
      })
      .expect(201);
    const tripId = tripResp.body.id as string;

    // 5) Passenger creates a booking
    const bookingResp = await request(app.getHttpServer())
      .post('/bookings')
      .set('x-extl-id', passengerExtl)
      .send({ tripId, seats: 1 })
      .expect(201);
    const bookingId = bookingResp.body.id as string;

    // 6) Driver accepts the booking -> seatsLeft should decrement
    await request(app.getHttpServer())
      .patch(`/driver/bookings/${bookingId}/accept`)
      .set('x-extl-id', driverExtl)
      .expect(200);

    // 7) Driver sets status to completed
    await request(app.getHttpServer())
      .patch(`/driver/bookings/${bookingId}/status`)
      .set('x-extl-id', driverExtl)
      .send({ status: 'completed' })
      .expect(200);

    // 8) Passenger cancels (should be allowed or no-op based on business rules)
    await request(app.getHttpServer())
      .delete(`/bookings/${bookingId}`)
      .set('x-extl-id', passengerExtl)
      .expect(200);
  });
});

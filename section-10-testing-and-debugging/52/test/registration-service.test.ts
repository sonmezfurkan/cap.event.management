import cds from '@sap/cds'

const test = cds.test(__dirname + '/..', '--with-mocks')
const { GET, POST, expect } = test

// Default to attendee credentials
test.axios.defaults.auth = { username: 'attendee', password: 'attendee' }

describe('RegistrationService', () => {
  beforeEach(test.data.reset)

  // SAP TechEd 2026 — published, capacity 5000
  const publishedEventId = '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'
  // DevConnect 2026 — draft, capacity 500
  const draftEventId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  describe('register action', () => {

    it('succeeds and returns confirmation code', async () => {
      const { data } = await POST('/odata/v4/registration/register', {
        eventId: publishedEventId,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      })
      expect(data).to.have.property('confirmationCode')
      expect(data.confirmationCode).to.match(/^EVT-[A-Z0-9]{6}$/)
      expect(data.status).to.equal('confirmed')
    })

    it('rejects duplicate registration', async () => {
      const payload = {
        eventId: publishedEventId,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      }
      await POST('/odata/v4/registration/register', payload)

      // Same user, same event → 409
      const { status } = await POST(
        '/odata/v4/registration/register', payload
      ).catch(e => e.response)
      expect(status).to.equal(409)
    })

    it('rejects registration for unpublished event', async () => {
      const { status } = await POST('/odata/v4/registration/register', {
        eventId: draftEventId,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      }).catch(e => e.response)
      expect(status).to.equal(409)
    })

    it('rejects registration when event is full', async () => {
      // Events is draft-enabled (lesson 22), so HTTP POST creates a draft and
      // bound actions need IsActiveEntity in the URL. We sidestep that by
      // inserting at the DB layer and dispatching `publish` through the
      // service with a privileged user — same pattern as lesson 50.
      const adminSrv = await cds.connect.to('AdminService') as any
      const eventId = '99999999-9999-9999-9999-999999999999'
      await cds.db.run(INSERT.into('events.Events').entries({
        ID: eventId,
        title: 'Tiny Event',
        startDate: '2026-09-01',
        endDate: '2026-09-02',
        maxCapacity: 1,
        venue_ID: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      }))
      await cds.tx({ user: new cds.User.Privileged() } as any, () =>
        adminSrv.send({ event: 'publish', entity: 'AdminService.Events', params: [{ ID: eventId }] })
      )

      // First registration succeeds
      await POST('/odata/v4/registration/register', {
        eventId,
        firstName: 'First',
        lastName: 'Person',
        email: 'first@example.com',
      })

      // Second registration fails — fully booked
      const { status } = await POST('/odata/v4/registration/register', {
        eventId,
        firstName: 'Second',
        lastName: 'Person',
        email: 'second@example.com',
      }).catch(e => e.response)
      expect(status).to.equal(409)
    })

  })

  describe('cancel action', () => {

    it('flips registration status to cancelled', async () => {
      // Register first
      const { data: reg } = await POST('/odata/v4/registration/register', {
        eventId: publishedEventId,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      })

      // Cancel it — `action cancel()` declares no return type, so the
      // response is 204 with no body. Re-read to verify persisted state.
      await POST(
        `/odata/v4/registration/Registrations(${reg.ID})/RegistrationService.cancel`
      )
      const { data } = await GET(
        `/odata/v4/registration/Registrations(${reg.ID})`
      )
      expect(data.status).to.equal('cancelled')
    })

  })

  describe('checkAvailability function', () => {

    it('returns correct seat counts', async () => {
      const { data } = await GET(
        `/odata/v4/registration/checkAvailability(eventId=${publishedEventId})`
      )
      expect(data).to.containSubset({
        available: true,
        totalSeats: 5000,
      })
      expect(data.bookedSeats).to.be.a('number')
      expect(data.remainingSeats).to.equal(data.totalSeats - data.bookedSeats)
    })

  })

  describe('row-level security', () => {

    it('registrations scoped to own user', async () => {
      // Register as attendee
      await POST('/odata/v4/registration/register', {
        eventId: publishedEventId,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      })

      // Read registrations — should see own only
      const { data } = await GET('/odata/v4/registration/Registrations')
      expect(data.value).to.be.an('array')
      data.value.forEach((r: any) => {
        expect(r.createdBy).to.equal('attendee')
      })
    })

  })

})

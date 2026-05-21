import cds from "@sap/cds";
import { Events, Registrations } from "#cds-models/RegistrationService";

export default class extends cds.ApplicationService {
    init() {
        this.on('register', this.onRegister);
        this.on('cancel', this.onCancel);
        this.on('checkAvailability', this.onCheckAvailability);

        return super.init();
    }

    private async onRegister(req: cds.Request) {
        const { eventId, firstName, lastName, email } = req.data;

        // Validate event
        const event = await SELECT.one.from(Events).where({ ID: eventId });
        if (!event) return req.reject(404, 'Event not found');

        if (event.status !== 'published') {
            return req.reject(409, 'Registration is only open for published events');
        }

        // Check capacity
        const { count } = await SELECT.one.from(Registrations)
            .columns('count(*) as count')
            .where({ event_ID: eventId, status: 'confirmed' }) as { count: number };

        if (event.maxCapacity && count >= event.maxCapacity) {
            return req.reject(409, `Event "${event.title}" is fully booked`);
        }

        // Generate confirmation code
        const confirmationCode = 'EVT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create the registration
        await INSERT.into(Registrations).entries({
            event_ID: eventId,
            firstName,
            lastName,
            email,
            confirmationCode,
        });

        // Return the created registration
        return SELECT.one.from(Registrations).where({ confirmationCode });
    }

    private async onCancel(req: cds.Request) {  // ← new method
        const { ID } = req.params[0] as { ID: string };

        const registration = await SELECT.one.from(Registrations).where({ ID });
        if (!registration) return req.reject(404, 'Registration not found');

        if (registration.status === 'cancelled') {
            return req.reject(409, 'Registration is already cancelled');
        }

        await UPDATE(Registrations, ID).set({ status: 'cancelled' });

        return SELECT.one.from(Registrations).where({ ID });
    }

    private async onCheckAvailability(req: cds.Request) {  // ← new method
        const { eventId } = req.data;

        const event = await SELECT.one.from(Events).where({ ID: eventId });
        if (!event) return req.reject(404, 'Event not found');

        const { count } = await SELECT.one.from(Registrations)
            .columns('count(*) as count')
            .where({ event_ID: eventId, status: 'confirmed' }) as { count: number };
        const bookedSeats = count ?? 0;

        const totalSeats = event.maxCapacity ?? 0;

        return {
            available: bookedSeats < totalSeats,
            totalSeats,
            bookedSeats,
            remainingSeats: totalSeats - bookedSeats,
        };
    }
}
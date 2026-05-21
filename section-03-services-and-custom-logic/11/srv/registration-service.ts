import cds from "@sap/cds";
import { Events, Registrations } from "#cds-models/RegistrationService";

export default class extends cds.ApplicationService {
    init() {
        this.before("CREATE", Registrations, this.validateRegistration);
        this.before("CREATE", Registrations, this.generateConfirmationCode);

        return super.init();
    }

    private async validateRegistration(req: cds.Request) {
        const { event_ID } = req.data;

        // Check event exists and is open for registration
        const event = await SELECT.one.from(Events).where({ ID: event_ID });

        if (!event) return req.reject(404, 'Event not found');

        if (event.status !== "published")
            req.error(409, 'Registration is only open for published events');

        // Check capacity
        const registrations = await SELECT.from(Registrations).where({ event_ID, status: "confirmed" });
        const count = registrations.length;

        if (event.maxCapacity && count >= event.maxCapacity)
            return req.reject(409, `Event ${event.title} is fully booked`);

        // Warn if almost full (90%+ capacity)
        if (event.maxCapacity && count >= event.maxCapacity * 0.9) {
            const remaining = event.maxCapacity - count;
            req.warn(200, `Only ${remaining} seat${remaining === 1 ? '' : 's'} remaining`);
        }
    }

    private generateConfirmationCode(req: cds.Request) {
        req.data.confirmationCode = 'EVT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}
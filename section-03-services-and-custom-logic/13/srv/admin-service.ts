import cds from "@sap/cds";
import { Events, Registrations } from "#cds-models/AdminService";

export default class AdminService extends cds.ApplicationService {
    init() {
        // before - validation, modify, authentication
        this.before(["CREATE", "UPDATE"], Events, req => {
            if (req.data.startDate && req.data.endDate) {
                if (req.data.startDate >= req.data.endDate) {
                    req.reject(400, "End date must be later than the start date")
                }
            }
        })

        // after - enrich, modify, tirgger
        this.after("READ", Events, (results) => {
            if (!results) return;

            for (const event of results) {
                if (event.description && event.description.length > 200) {
                    event.description = event.description.substring(0, 200) + "..."
                }
            }
        })

        this.after("READ", Events, this.calculateDerivedValues);

        this.on('publish', this.onPublish);
        this.on('cancelEvent', this.onCancelEvent);

        return super.init()
    }



    private async onPublish(req: cds.Request) {
        const { ID } = req.params[0] as { ID: string };

        const event = await SELECT.one.from(Events).where({ ID });
        if (!event) return req.reject(404, 'Event not found');

        if (event.status === 'published') {
            return req.reject(409, 'Event is already published');
        }

        if (event.status === 'cancelled') {
            return req.reject(409, 'Cannot publish a cancelled event');
        }

        // Validate event is ready for publication
        if (!event.venue_ID) {
            req.error(422, 'Event must have a venue before publishing', 'venue_ID');
        }

        if (!event.startDate || !event.endDate) {
            req.error(422, 'Event must have start and end dates before publishing', 'startDate');
        }

        // req.error collects errors — if any were added, CAP will abort after this handler
        // We can still continue checking, but let's return early if there are errors
        if ((req as any).errors) return; // .errors exists at runtime but is missing from the type definitions

        await UPDATE(Events, ID).set({ status: 'published' });

        return SELECT.one.from(Events).where({ ID });
    }

    private async onCancelEvent(req: cds.Request) {  // ← new method
        const { ID } = req.params[0] as { ID: string };

        const event = await SELECT.one.from(Events).where({ ID });
        if (!event) return req.reject(404, 'Event not found');

        if (event.status === 'cancelled') {
        return req.reject(409, 'Event is already cancelled');
        }

        await UPDATE(Events, ID).set({ status: 'cancelled' });

        // Cancel all confirmed registrations for this event
        await UPDATE(Registrations).set({ status: 'cancelled' })
            .where({ event_ID: ID, status: 'confirmed' });

        return SELECT.one.from(Events).where({ ID });
    }

    private async calculateDerivedValues(results: Events) {
        for (const event of results) {
            const registrations = await SELECT.from(Registrations).where({
                event_ID: event.ID,
                status: "confirmed"
            })

            event.attendeeCount = registrations.length;
            event.seatsRemaining = (event.maxCapacity ?? 0) - event.attendeeCount;
        }
    }
}
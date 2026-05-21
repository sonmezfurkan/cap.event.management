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

        // Event subscribers
        this.on('EventPublished', this.onEventPublished);
        this.on('EventCancelled', this.onEventCancelled);

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

        await this.emit('EventPublished', {
            eventId: ID,
            title: event.title,
        });

        return SELECT.one.from(Events).where({ ID });
    }

    private async onCancelEvent(req: cds.Request) {
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

        await this.emit('EventCancelled', {
            eventId: ID,
            title: event.title,
        });

        return SELECT.one.from(Events).where({ ID });
    }

    private async calculateDerivedValues(results: Events) {
        const eventIds = results.map(e => e.ID).filter(Boolean);
        if (eventIds.length === 0) return;

        // Single query — count registrations for ALL events at once
        const counts = await SELECT.from(Registrations)
            .columns('event_ID', 'count(*) as count')
            .where({ event_ID: { in: eventIds }, status: 'confirmed' })
            .groupBy('event_ID');

        // 0   Neutral
        // 1   Negative
        // 2   Ciritical
        // 3   Positive

        // draft       2
        // published   3
        // cancelled   1
        // completed   0

        // Build a lookup map: event ID → registration count
        const countMap = new Map(counts.map((c: any) => [c.event_ID, c.count])); // 'count' is a SQL alias, not in the Registration type

        const criticality: Record<string, number> = {
            draft: 2, published: 3, cancelled: 1, completed: 0
        }

        for (const event of results) {
            const attendeeCount = countMap.get(event.ID) ?? 0;

            event.attendeeCount = attendeeCount;
            event.seatsRemaining = (event.maxCapacity ?? 0) - attendeeCount;

            event.statusCriticality = criticality[event.status as string] ?? 0
        }
    }

    // --- Event subscribers ---
    private async onEventPublished(msg: cds.Request) {
        const { title } = msg.data;

        console.log(`[Notification] Event "${title}" is now published and open for registration`);
    }

    private async onEventCancelled(msg: cds.Request) {
        const { title } = msg.data;

        console.log(`[Notification] Event "${title}" has been cancelled — attendees should be notified`);
    }
}
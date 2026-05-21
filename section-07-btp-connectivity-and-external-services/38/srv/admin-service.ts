import cds from "@sap/cds";
import {
  BusinessPartners,
  Events,
  Registrations,
  Speaker,
  Speakers,
} from "#cds-models/AdminService";

export default class AdminService extends cds.ApplicationService {
  private S4bupa!: cds.Service;

  async init() {
    this.S4bupa = await cds.connect.to("API_BUSINESS_PARTNER");

    // before - validation, modify, authentication
    this.before(["CREATE", "UPDATE"], Events, (req) => {
      if (req.data.startDate && req.data.endDate) {
        if (req.data.startDate >= req.data.endDate) {
          req.reject(400, "END_DATE_BEFORE_START");
        }
      }
    });

    this.after("READ", Events, this.calculateDerivedValues);

    this.on("publish", this.onPublish);
    this.on("cancelEvent", this.onCancelEvent);

    this.on("READ", BusinessPartners, (req) => this.S4bupa.run(req.query));
    this.after("READ", Speakers, this.enrichWithBusinessPartners);

    // Event subscribers
    this.on("EventPublished", this.onEventPublished);
    this.on("EventCancelled", this.onEventCancelled);

    return super.init();
  }

  private async onPublish(req: cds.Request) {
    const { ID } = req.params[0] as { ID: string };

    const event = await SELECT.one.from(Events).where({ ID });
    if (!event) return req.reject(404, "EVENT_NOT_FOUND");

    if (event.status === "published") {
      return req.reject(409, "EVENT_ALREADY_PUBLISHED");
    }

    if (event.status === "cancelled") {
      return req.reject(409, "CANNOT_PUBLISH_CANCELLED");
    }

    // Validate event is ready for publication
    if (!event.venue_ID) {
      req.error(422, "PUBLISH_REQUIRES_VENUE", "venue_ID");
    }

    if (!event.startDate || !event.endDate) {
      req.error(422, "PUBLISH_REQUIRES_DATES", "startDate");
    }

    // req.error collects errors — if any were added, CAP will abort after this handler
    // We can still continue checking, but let's return early if there are errors
    if ((req as any).errors) return; // .errors exists at runtime but is missing from the type definitions

    await UPDATE(Events, ID).set({ status: "published" });

    await this.emit("EventPublished", {
      eventId: ID,
      title: event.title,
    });

    return SELECT.one.from(Events).where({ ID });
  }

  private async onCancelEvent(req: cds.Request) {
    const { ID } = req.params[0] as { ID: string };

    const event = await SELECT.one.from(Events).where({ ID });
    if (!event) return req.reject(404, "EVENT_NOT_FOUND");

    if (event.status === "cancelled") {
      return req.reject(409, "EVENT_ALREADY_CANCELLED");
    }

    await UPDATE(Events, ID).set({ status: "cancelled" });

    // Cancel all confirmed registrations for this event
    await UPDATE(Registrations)
      .set({ status: "cancelled" })
      .where({ event_ID: ID, status: "confirmed" });

    await this.emit("EventCancelled", {
      eventId: ID,
      title: event.title,
    });

    return SELECT.one.from(Events).where({ ID });
  }

  private async calculateDerivedValues(results: Events) {
    const eventIds = results.map((e) => e.ID).filter(Boolean);
    if (eventIds.length === 0) return;

    // Single query — count registrations for ALL events at once
    const counts = await SELECT.from(Registrations)
      .columns("event_ID", "count(*) as count")
      .where({ event_ID: { in: eventIds }, status: "confirmed" })
      .groupBy("event_ID");

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
      draft: 2,
      published: 3,
      cancelled: 1,
      completed: 0,
    };

    for (const event of results) {
      const attendeeCount = countMap.get(event.ID) ?? 0;

      event.attendeeCount = attendeeCount;
      event.seatsRemaining = (event.maxCapacity ?? 0) - attendeeCount;

      event.statusCriticality = criticality[event.status as string] ?? 0;
    }
  }

  private async enrichWithBusinessPartners(
    results: Speaker | Speakers,
    req: cds.Request,
  ) {
    const speakers = Array.isArray(results) ? results : [results];
    const bpNumbers = speakers.map((s) => s.businessPartner).filter(Boolean);

    if (bpNumbers.length === 0) return;

    const bps = await this.S4bupa.run(
      SELECT.from("API_BUSINESS_PARTNER.A_BusinessPartner")
        .columns("BusinessPartner", "BusinessPartnerFullName")
        .where({ BusinessPartner: { in: bpNumbers } }),
    );

    const bpMap = new Map<string, string>(
      bps.map((bp: any) => [bp.BusinessPartner, bp.BusinessPartnerFullName]),
    );

    for (const speaker of speakers) {
      if (speaker.businessPartner) {
        speaker.businessPartnerFullName =
          bpMap.get(speaker.businessPartner) ?? null;
      }
    }
  }

  // --- Event subscribers ---
  private async onEventPublished(msg: cds.Request) {
    const { title } = msg.data;

    console.log(
      `[Notification] Event "${title}" is now published and open for registration`,
    );
  }

  private async onEventCancelled(msg: cds.Request) {
    const { title } = msg.data;

    console.log(
      `[Notification] Event "${title}" has been cancelled — attendees should be notified`,
    );
  }
}

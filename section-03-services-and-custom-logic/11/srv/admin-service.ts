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

        return super.init()
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
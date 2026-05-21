import cds from "@sap/cds";
import { Event } from "#cds-models/AdminService"

export default class AdminService extends cds.ApplicationService {
    init() {
        const { Events } = this.entities

        // before - validation, modify, authentication
        this.before(["CREATE", "UPDATE"], Events, req => {
            if (req.data.startDate && req.data.endDate) {
                if (req.data.startDate >= req.data.endDate) {
                    req.reject(400, "End date must be later than the start date")
                }
            }
        })

        // on - replaces the built-in handler
        /* this.on("READ", Events, req => {
            return [{
                ID: "123",
                title: "Dummy event"
            }]
        }) */

        // after - enrich, modify, tirgger
        this.after("READ", Events, (results: Array<Event>) => {
            for (const event of results) {
                if (event.description && event.description.length > 200) {
                    event.description = event.description.substring(0, 200) + "..."
                }
            }
        })

        return super.init()
    }
}
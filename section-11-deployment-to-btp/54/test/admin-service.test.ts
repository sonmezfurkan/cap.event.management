import cds from "@sap/cds";

const test = cds.test(__dirname + "/..", "--with-mocks");
const { GET, POST, PATCH, expect } = test;

// DELETE stays on the `test` handle — destructuring it would shadow CAP's
// global query builders (INSERT, SELECT, UPDATE, DELETE), and INSERT/SELECT
// are used in the service-layer tests below.

// Default to admin credentials for most tests
test.axios.defaults.auth = {
	username: "admin",
	password: "admin",
};

describe("AdminService", () => {
	describe("CRUD Operations", () => {
		it("serves $metadata", async () => {
			const { status } = await GET("/odata/v4/admin/$metadata");
			expect(status).to.equal(200);
		});

		it("reads events with seed data", async () => {
			const { data } = await GET("/odata/v4/admin/Events");
			expect(data.value).to.be.an("array").that.is.not.empty;
		});

		it("expands venue on events", async () => {
			const { data } = await GET("/odata/v4/admin/Events?$expand=venue");
			const withVenue = data.value.find((e: any) => e.venue !== null);
			expect(withVenue).to.exist;
			expect(withVenue.venue).to.have.property("name");
		});

		it("computes derived values", async () => {
			const { data } = await GET("/odata/v4/admin/Events");

			data.value.forEach((e: any) => {
				expect(e).to.have.property("attendeeCount");
				expect(e).to.have.property("seatsRemaining");
				expect(e.attendeeCount).to.be.a("number");
			});
		});
	});

	describe("Venues (HTTP mutations)", () => {
		beforeEach(test.data.reset);

		it("creates and deletes a venue", async () => {
			const { data: created } = await POST("/odata/v4/admin/Venues", {
				name: "Test Venue",
				city: "Berlin",
			});
			expect(created.name).to.equal("Test Venue");

			const { status } = await test.DELETE(
				`/odata/v4/admin/Venues(${created.ID})`,
			);
			expect(status).to.equal(204);
		});
	});

	describe("Events (service layer)", () => {
		let srv: any;

		beforeAll(async () => {
			srv = await cds.connect.to("AdminService");
		});

		beforeEach(test.data.reset);

		// Service-layer calls bypass HTTP, so axios auth defaults don't apply.
		// AdminService is @requires: [Admin, Organizer], so every call needs a user.
		// We're testing business logic here — auth has its own describe block.
		const asAdmin = (fn: () => Promise<any>): Promise<any> =>
			cds.tx({ user: new cds.User.Privileged() } as any, fn);

		it("rejects startDate >= endDate", async () => {
			await expect(
				asAdmin(() =>
					srv.run(
						INSERT.into("AdminService.Events").entries({
							title: "Bad Dates",
							startDate: "2026-12-01",
							endDate: "2026-11-01",
							maxCapacity: 100,
						}),
					),
				),
			).to.be.rejectedWith(/END_DATE_BEFORE_START/);
		});

		it("publishes a valid event", async () => {
			// DevConnect 2026 is in draft status, has venue + dates
			const eventId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
			await asAdmin(() =>
				srv.send({
					event: "publish",
					entity: "AdminService.Events",
					params: [{ ID: eventId }],
				}),
			);

			const event = await asAdmin(() =>
				srv.run(SELECT.one.from("AdminService.Events").where({ ID: eventId })),
			);
			expect(event.status).to.equal("published");
		});

		it("rejects publish without venue", async () => {
			const ID = "11111111-1111-1111-1111-111111111111";
			// Insert via DB to skip the draft/attachments pipeline
			await cds.db.run(
				INSERT.into("events.Events").entries({
					ID,
					title: "No Venue Event",
					startDate: "2026-06-01",
					endDate: "2026-06-02",
					maxCapacity: 100,
				}),
			);
			await expect(
				asAdmin(() =>
					srv.send({
						event: "publish",
						entity: "AdminService.Events",
						params: [{ ID }],
					}),
				),
			).to.be.rejectedWith(/PUBLISH_REQUIRES_VENUE/);
		});

		it("cancelEvent cascades to registrations", async () => {
			// SAP TechEd 2026 is published and has registrations
			const eventId = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";
			await asAdmin(() =>
				srv.send({
					event: "cancelEvent",
					entity: "AdminService.Events",
					params: [{ ID: eventId }],
				}),
			);

			const event = await asAdmin(() =>
				srv.run(SELECT.one.from("AdminService.Events").where({ ID: eventId })),
			);
			expect(event.status).to.equal("cancelled");

			const active = await asAdmin(() =>
				srv.run(
					SELECT.from("AdminService.Registrations").where({
						event_ID: eventId,
						status: { "!=": "cancelled" },
					}),
				),
			);
			expect(active).to.be.empty;
		});

		it("soft deletes instead of hard delete", async () => {
			const eventId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
			// Use HTTP — the onSoftDelete handler reads req.params[0], which is
			// populated from the URL path. Service-layer DELETE goes through the
			// draft dispatcher and doesn't carry the path key the handler expects.
			// Draft-enabled entities need IsActiveEntity in the key
			const { status } = await test.DELETE(
				`/odata/v4/admin/Events(ID=${eventId},IsActiveEntity=true)`,
			);
			expect(status).to.equal(204);

			// filterDeleted hides it from service reads
			const visible = await asAdmin(() =>
				srv.run(SELECT.one.from("AdminService.Events").where({ ID: eventId })),
			);
			expect(visible).to.be.undefined;

			// But the row still exists in the DB — it's just marked deleted
			const raw = await cds.db.run(
				SELECT.one.from("events.Events").where({ ID: eventId }),
			);
			expect(raw.isDeleted).to.be.true;
		});
	});

	describe("Authorization", () => {
		it("rejects unauthenticated access", async () => {
			// auth: undefined doesn't clear axios defaults — we must null it explicitly
			const { status } = await GET("/odata/v4/admin/Events", {
				auth: null as any,
				headers: { Authorization: null } as any,
			}).catch((e) => e.response);
			expect(status).to.equal(401);
		});

		it("rejects attendee from AdminService", async () => {
			const { status } = await GET("/odata/v4/admin/Events", {
				auth: { username: "attendee", password: "attendee" },
			}).catch((e) => e.response);
			expect(status).to.equal(403);
		});

		it("admin sees all events", async () => {
			const { data } = await GET("/odata/v4/admin/Events");
			// Admin sees draft + published (soft-deleted excluded by filterDeleted)
			expect(data.value.length).to.be.greaterThan(1);
		});

		it("organizer sees only own events", async () => {
			const organizer = {
				auth: { username: "organizer", password: "organizer" },
			};
			const { data } = await GET("/odata/v4/admin/Events", organizer);
			data.value.forEach((e: any) => {
				expect(e.createdBy).to.equal("organizer");
			});
		});

		it("organizer cannot create venues", async () => {
			const organizer = {
				auth: { username: "organizer", password: "organizer" },
			};
			const { status } = await POST(
				"/odata/v4/admin/Venues",
				{
					name: "Sneaky Venue",
				},
				organizer,
			).catch((e) => e.response);
			expect(status).to.equal(403);
		});
	});
});

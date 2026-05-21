import cds from "@sap/cds";

const test = cds.test(__dirname + "/..", "--with-mocks");
const { GET, expect } = test;

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
});

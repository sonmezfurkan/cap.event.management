import cds from "@sap/cds";

const test = cds.test(__dirname + "/..", "--with-mocks");
const { GET, expect } = test;

describe("CatalogService", () => {
	it("serves $metadata", async () => {
		const { status, headers } = await GET("/odata/v4/catalog/$metadata");

		expect(status).to.equal(200);
		expect(headers["content-type"]).to.contain("application/xml");
	});

	it("returns published events only", async () => {
		const { data } = await GET("/odata/v4/catalog/Events");

		expect(data.value).to.be.an("array").that.is.not.empty;
		data.value.forEach((e: any) => {
			expect(e.status).to.equal("published");
		});
	});
});

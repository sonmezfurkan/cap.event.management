import cds from "@sap/cds";
import fs from "node:fs";
import path from "node:path";

const IMAGES_DIR = path.join(cds.root, "srv/_assets/images");

const SPEAKER_IMAGES: Record<string, string> = {
  "550e8400-e29b-41d4-a716-446655440000": "jane.png",
  "6ba7b810-9dad-11d1-80b4-00c04fd430c8": "john.png",
  "7c9e6679-7425-40de-944b-e07fc1f90ae7": "lisa.png",
  "8f14e45f-ceea-467f-a836-1d1e2e5f1c3a": "marco.png",
};

const EVENT_BANNERS: Record<string, string> = {
  "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b": "tech-ed.png",
  "3fa85f64-5717-4562-b3fc-2c963f66afa6": "cloud-summit.png",
  "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11": "dev-connect.png",
};

const log = cds.log("media-bootstrap");

cds.on("served", async () => {
  if (!fs.existsSync(IMAGES_DIR)) {
    log.info("skipped — images dir missing:", IMAGES_DIR);
    return;
  }

  const db = await cds.connect.to("db");
  const { Speakers, Events } = cds.entities("events");

  await db.tx(async (tx) => {
    await seed(tx, Speakers, SPEAKER_IMAGES, "photo", "photoType", "photoName");
    await seed(tx, Events, EVENT_BANNERS, "banner", "bannerType", "bannerName");
  });
});

async function seed(
  tx: cds.Service,
  entity: any,
  mapping: Record<string, string>,
  contentField: string,
  mimeField: string,
  nameField: string,
) {
  for (const [id, filename] of Object.entries(mapping)) {
    const row = await tx.run(SELECT.one.from(entity, id).columns(contentField));
    if (!row) {
      log.warn(`no ${entity.name} row for ${id} — skipping ${filename}`);
      continue;
    }
    if (row[contentField]) continue;

    const bytes = fs.readFileSync(path.join(IMAGES_DIR, filename));
    await tx.run(
      UPDATE(entity, id).set({
        [contentField]: bytes,
        [mimeField]: `image/${path.extname(filename).slice(1)}`,
        [nameField]: filename,
      }),
    );
    log.info(`loaded ${filename} → ${entity.name}(${id})`);
  }
}

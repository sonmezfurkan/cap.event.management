# cap.event.management

Source code for **SAP CAP — From Zero to Production**, a full course that builds one real application — an event &amp; conference management platform — end to end with the SAP Cloud Application Programming Model (CAP).

▶️ **Get the course:** https://furkan.sonmez.me/sap-cap

## How this repo is organized

The code is grouped into the eleven course sections. Inside each section, every lesson folder (`<number>-<lesson-name>`) is the **complete project state at the end of that lesson** — a cumulative checkpoint you can open and run on its own.

```
section-02-domain-modeling/
  04-cds-modeling-fundamentals/
  05-associations-and-compositions/
  06-aspects-reuse-and-common-patterns/
  07-initial-data-and-database-setup/
section-03-services-and-custom-logic/
  08-defining-services-and-projections/
  …
  16-defining-and-emitting-events/
…
section-11-deployment-to-btp/
  54-understanding-the-mta/
  …
  57-sap-build-work-zone-integration/
```

So to see the code as it stood after **Lesson 24**, open `section-04-fiori-elements-ui-and-localization/24-test-data-and-sessions-object-page/`.

## Running a snapshot

Each folder is a standalone CAP project (Node.js + TypeScript):

```bash
cd section-03-services-and-custom-logic/16-defining-and-emitting-events
npm install
cds watch
```

You'll need [`@sap/cds-dk`](https://cap.cloud.sap/docs/get-started/) installed globally.

## Notes

- **Not every lesson has a folder.** Concept-only lessons and lessons that don't change any code are omitted (the deployment migration and course-recap lessons, 58–61, have no standalone code either).
- `node_modules`, build output (`gen/`), and local credential files are intentionally not committed — install dependencies fresh in each folder.
- Section 8's messaging lessons (40, 42) contain **two** projects — the main app (`cap-event-management/`) and the standalone notifications listener (`cap-event-notifications/`).

---

Course &amp; source code © Furkan Sönmez. Built with [SAP CAP](https://cap.cloud.sap).

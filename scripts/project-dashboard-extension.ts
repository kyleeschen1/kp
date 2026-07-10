import { createKpTheseusDashboardExtensionPayload } from "../src/project-dashboard/theseus-adapter.ts";

const payload = createKpTheseusDashboardExtensionPayload();

process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

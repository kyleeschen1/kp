import {
  createKpCanonicalPresentationAuditReport
} from "../src/editor/canonical-presentation-group-audit.ts";

const report = createKpCanonicalPresentationAuditReport();

console.log(JSON.stringify(report, null, 2));

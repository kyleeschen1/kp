import { createKpUnitValue } from
  "../../src/math/authoring/units.ts";
import { createKpSemanticStateCircleFamilyFixture } from
  "../fixtures/semantic-state-circle-family.ts";

const fixture = createKpSemanticStateCircleFamilyFixture();

fixture.family.reparameterize(fixture.application, {
  applicationId: "radius-six",
  parameters: {
    finalRadius: createKpUnitValue(fixture.measurement.units.radius, 6)
  },
  sourceId: "lesson.circle-measurement.state-family.type-positive"
});

fixture.family.reparameterize(fixture.application, {
  applicationId: "wrong-area-unit",
  parameters: {
    // @ts-expect-error Area values cannot become radius-family parameters.
    finalRadius: createKpUnitValue(fixture.measurement.units.area, 6)
  },
  sourceId: "lesson.circle-measurement.state-family.type-negative"
});

# Static contract fixtures

These negative compile fixtures verify internal or lazy capability-pack types
through `tsconfig.test.json`. They stay outside `tsconfig.inference.json`
because that fixed budget measures types paid by public authoring consumers,
not domain-private contracts.

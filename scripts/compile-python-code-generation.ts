import { readFile } from "node:fs/promises";

import {
  runKpPythonCodeGenerationCli
} from "./python-code-generation-authoring.ts";

const exitCode = await runKpPythonCodeGenerationCli(
  process.argv.slice(2),
  {
    readText: (path) => readFile(path, "utf8"),
    writeOutput: (text) => process.stdout.write(text),
    writeError: (text) => process.stderr.write(text)
  }
);
process.exitCode = exitCode;

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const excludedSegments = new Set(["admin", "auth", "call", "dashboard", "login", "signup"]);
const matches = [/\bBlue[Cc]all\b/, /\bBlue Call(?: IO)?\b/, /\bBlue[Cc]all\.io\b/, /\bbluecall\.io\b/];

function filesIn(directory) {
   return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
         return excludedSegments.has(entry) ? [] : filesIn(path);
      }
      return /\.(tsx?|jsx?)$/.test(entry) ? [path] : [];
   });
}

// Public-facing surfaces only: website content, plus published npm/repo metadata.
// Backend implementation detail (headers, internal identifiers) is a separate,
// breaking-change concern and is intentionally out of scope here.
const targets = [
   ...filesIn(join(process.cwd(), "apps/web/app")),
   join(process.cwd(), "package.json"),
   join(process.cwd(), "packages/sdk/package.json"),
   join(process.cwd(), "packages/sdk/README.md"),
   join(process.cwd(), "packages/react/package.json"),
   join(process.cwd(), "packages/react/README.md"),
].filter((path) => existsSync(path));

const findings = [];
for (const file of targets) {
   readFileSync(file, "utf8").split("\n").forEach((text, index) => {
      if (!matches.some((pattern) => pattern.test(text))) return;
      const classification = /third.party/i.test(text)
         ? "THIRD_PARTY_REFERENCE"
         : text.includes("BlueCallio")
           ? "VALID_BLUECALLIO"
           : "ACCIDENTAL_REFERENCE";
      findings.push({ file: relative(process.cwd(), file), line: index + 1, text: text.trim(), classification });
   });
}

if (findings.length) console.table(findings);
const accidental = findings.filter((finding) => finding.classification === "ACCIDENTAL_REFERENCE");
if (accidental.length) {
   process.exitCode = 1;
   console.error(`Found ${accidental.length} accidental public branding reference(s).`);
}

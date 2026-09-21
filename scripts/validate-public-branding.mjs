import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const excludedSegments = new Set([
   "admin", "auth", "call", "dashboard", "login", "signup", // private app routes
   "node_modules", ".git", ".next", "dist", "build", "coverage",
]);

// Two failure modes post-rebrand:
// 1. Leftover old-brand references (any casing/spacing of "BlueCallio"/"Bluecall").
// 2. Malformed new-brand references (e.g. "PurpleCall" missing "io", "Purple Call").
const oldBrandPatterns = [/\bBlue[Cc]all(?:io)?\b/, /\bBlue Call(?: IO)?\b/, /\bBlue[Cc]all\.io\b/, /\bbluecall\.io\b/];
const newBrandTypoPatterns = [/\bPurple[Cc]all\b/, /\bPurple Call(?: IO)?\b/, /\bPurple[Cc]all\.io\b/, /\bpurplecall\.io\b/];

function filesIn(directory) {
   if (!existsSync(directory)) return [];
   return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
         return excludedSegments.has(entry) ? [] : filesIn(path);
      }
      return /\.(tsx?|jsx?|mjs|md|conf|sh|prisma)$/.test(entry) ? [path] : [];
   });
}

// Public-facing surfaces plus published npm metadata and the backend
// implementation detail that ended up in customer-visible contracts
// (webhook header names, invoice text, TURN credentials).
const targets = [
   ...filesIn(join(process.cwd(), "apps/web/app")),
   ...filesIn(join(process.cwd(), "apps/server/src")),
   ...filesIn(join(process.cwd(), "infra")),
   ...filesIn(join(process.cwd(), "packages/sdk/src")),
   ...filesIn(join(process.cwd(), "packages/react/src")),
   join(process.cwd(), "package.json"),
   join(process.cwd(), "packages/sdk/package.json"),
   join(process.cwd(), "packages/sdk/README.md"),
   join(process.cwd(), "packages/react/package.json"),
   join(process.cwd(), "packages/react/README.md"),
].filter((path) => existsSync(path));

const findings = [];
for (const file of targets) {
   readFileSync(file, "utf8").split("\n").forEach((text, index) => {
      const isHistorical = /\b(formerly|previously|rebrand|migrat\w*)\b/i.test(text);
      const hasOldBrand = oldBrandPatterns.some((pattern) => pattern.test(text));
      const hasNewBrandTypo = newBrandTypoPatterns.some((pattern) => pattern.test(text));
      if (!hasOldBrand && !hasNewBrandTypo) return;
      const classification = isHistorical
         ? "HISTORICAL_REFERENCE"
         : hasOldBrand
           ? "OLD_BRAND_LEFTOVER"
           : "NEW_BRAND_TYPO";
      findings.push({ file: relative(process.cwd(), file), line: index + 1, text: text.trim(), classification });
   });
}

if (findings.length) console.table(findings);
const accidental = findings.filter((finding) => finding.classification !== "HISTORICAL_REFERENCE");
if (accidental.length) {
   process.exitCode = 1;
   console.error(`Found ${accidental.length} unintended branding reference(s).`);
}

import { readFileSync } from "node:fs";

const source = readFileSync("src/app/api/client/register/route.ts", "utf8");

const required = [
  "async function findExistingClientRuntime(supabase: AdminSupabaseClient, emailsToCheck: string[])",
  "const emails = new Set(emailsToCheck.map(normaliseEmail).filter(Boolean));",
  "const submittedAt = new Date().toISOString();",
  "const consentAcceptedAt = submittedAt;",
  "const existing = await findExistingClientRuntime(supabase, [email, billingEmail]);",
  "id: localClientId()",
  "registeredAt: submittedAt",
];

const forbidden = [
  "id: cleanText(body.id) || localClientId()",
  "const consentAcceptedAt = cleanText(body.consent?.acceptedAt) || new Date().toISOString();",
  "findExistingClientRuntime(supabase, email)",
];

const missing = required.filter((marker) => !source.includes(marker));
const presentForbidden = forbidden.filter((marker) => source.includes(marker));

if (missing.length || presentForbidden.length) {
  console.error("Public registration hardening verification failed:");
  for (const marker of missing) console.error(`- missing ${marker}`);
  for (const marker of presentForbidden) console.error(`- forbidden ${marker}`);
  process.exit(1);
}

console.log("Public registration hardening verification passed.");

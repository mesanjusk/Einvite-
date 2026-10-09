/**
 * Temporary launch policy. Instagram automation and DM links remain installed.
 * Publication / public invitation visibility must not depend on an external
 * follow-check while the launch gate is paused.
 *
 * Opt in with INSTAGRAM_VALIDATION_ENABLED=true after the external
 * Instagram follow/DM verification has passed production tests.
 * No NEXT_PUBLIC variable is used: guests cannot override this policy.
 */
export function instagramValidationEnabled(
  value: string | undefined = process.env.INSTAGRAM_VALIDATION_ENABLED,
): boolean {
  return value === "true";
}

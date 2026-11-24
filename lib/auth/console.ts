/** Which console the current sign-in opened. httpOnly cookie, set at login. */
export const CONSOLE_COOKIE = "dsm_console";

export type ConsoleDoor = "software" | "school";

export function consoleHome(door: string | undefined): "/vendor/schools" | "/dashboard" {
  return door === "software" ? "/vendor/schools" : "/dashboard";
}

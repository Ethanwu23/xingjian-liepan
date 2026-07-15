export type AppUser = {
  displayName: string;
  email: string;
  fullName: string | null;
  isSimulated: boolean;
};

export function getLocalDevelopmentUser(
  environment: Record<string, string | undefined> = process.env,
  isDevelopment = environment.NODE_ENV === "development",
): AppUser | null {
  if (!isDevelopment || environment.LOCAL_AUTH_ENABLED === "false") {
    return null;
  }

  const email = environment.LOCAL_AUTH_EMAIL?.trim() || "local.cpi.user@example.test";
  const fullName = environment.LOCAL_AUTH_NAME?.trim() || "本地模拟用户";
  return { displayName: fullName, email, fullName, isSimulated: true };
}

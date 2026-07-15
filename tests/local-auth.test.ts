import assert from "node:assert/strict";
import test from "node:test";
import { getLocalDevelopmentUser } from "../lib/auth/local-user.ts";

test("creates a configurable simulated account in development", () => {
  const user = getLocalDevelopmentUser({
    NODE_ENV: "development",
    LOCAL_AUTH_NAME: "测试舰长",
    LOCAL_AUTH_EMAIL: "captain@example.test",
  }, true);

  assert.deepEqual(user, {
    displayName: "测试舰长",
    email: "captain@example.test",
    fullName: "测试舰长",
    isSimulated: true,
  });
});

test("never creates a simulated account in production", () => {
  assert.equal(getLocalDevelopmentUser({ NODE_ENV: "development" }, false), null);
});

test("allows local account simulation to be disabled", () => {
  assert.equal(
    getLocalDevelopmentUser({ NODE_ENV: "development", LOCAL_AUTH_ENABLED: "false" }, true),
    null,
  );
});

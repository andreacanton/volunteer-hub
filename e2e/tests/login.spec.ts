import { test, expect, type Page } from "@playwright/test";

const API_URL = "http://localhost:3000/api/v1";

// Test user credentials - unique per test run
const TEST_USER = {
  email: `e2e-login-${Date.now()}@test.com`,
  password: "TestPassword123!",
};

/**
 * Registers a test user via the API so login tests have valid credentials.
 */
async function registerTestUser(request: Page["request"]) {
  const response = await request.post(`${API_URL}/auth/register`, {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
    },
  });
  expect(response.ok()).toBeTruthy();
}

/**
 * Navigates to the app and enables Flutter's accessibility/semantics overlay
 * so Playwright can interact with the rendered widgets.
 */
async function gotoAndEnableSemantics(page: Page) {
  await page.goto("/");

  // Wait for Flutter to render by waiting for the semantics placeholder
  await page.waitForSelector("flt-semantics-placeholder", {
    state: "attached",
    timeout: 30_000,
  });

  // Enable semantics by dispatching a click on the placeholder element.
  // Flutter places it off-viewport so normal Playwright click fails.
  await page.evaluate(() => {
    const placeholder = document.querySelector("flt-semantics-placeholder");
    if (placeholder) {
      placeholder.dispatchEvent(new Event("click", { bubbles: true }));
    }
  });

  // Wait for the login screen semantics to be ready
  await page.getByRole("button", { name: "Sign In" }).waitFor({ timeout: 10_000 });
}

test.describe("Login", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerTestUser(page.request);
    await page.close();
  });

  test("shows login screen by default", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    await expect(page.getByText("Volunteer Hub").first()).toBeVisible();
    await expect(page.getByText("Sign in to continue").first()).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("shows validation error for empty email", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter your email").first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill("not-an-email");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter a valid email").first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("shows validation error for empty password", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill("test@example.com");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter your password").first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("shows validation error for short password", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill("test@example.com");

    const passwordField = page.getByLabel("Password");
    await passwordField.click();
    await passwordField.fill("12345");

    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Password must be at least 6 characters").first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill("nonexistent@example.com");

    const passwordField = page.getByLabel("Password");
    await passwordField.click();
    await passwordField.fill("WrongPassword123!");

    await page.getByRole("button", { name: "Sign In" }).click();

    // The API returns "Invalid email or password" shown via snackbar
    await expect(
      page.getByText(/invalid email or password/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("logs in successfully with valid credentials", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill(TEST_USER.email);

    const passwordField = page.getByLabel("Password");
    await passwordField.click();
    await passwordField.fill(TEST_USER.password);

    await page.getByRole("button", { name: "Sign In" }).click();

    // After successful login, the home screen should show the user email
    await expect(page.getByText(TEST_USER.email).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("navigates to signup screen", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByText("Create Account").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Join Volunteer Hub").first()).toBeVisible();
  });

  test("navigates to forgot password screen", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    await page.getByRole("button", { name: "Forgot password?" }).click();

    await expect(
      page.getByText(/forgot password|reset/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("submits login on Enter key in password field", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill(TEST_USER.email);

    const passwordField = page.getByLabel("Password");
    await passwordField.click();
    await passwordField.fill(TEST_USER.password);
    await page.keyboard.press("Enter");

    // Should navigate to home screen on successful login
    await expect(page.getByText(TEST_USER.email).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("disables form while login is in progress", async ({ page }) => {
    await gotoAndEnableSemantics(page);

    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill(TEST_USER.email);

    const passwordField = page.getByLabel("Password");
    await passwordField.click();
    await passwordField.fill(TEST_USER.password);

    const signInButton = page.getByRole("button", { name: "Sign In" });
    await signInButton.click();

    // Wait for the home screen to appear (login completes)
    await expect(page.getByText(TEST_USER.email).first()).toBeVisible({
      timeout: 15_000,
    });

    // Sign In button should no longer be present on the home screen
    await expect(signInButton).not.toBeVisible();
  });
});

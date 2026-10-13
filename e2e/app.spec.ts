import { expect, test, type Browser, type Page } from "@playwright/test";

const BACKEND = "http://localhost:4100";
const PASSWORD = "Password123!";

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("ایمیل").fill(email);
  await page.getByLabel("رمز عبور").fill(password);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page).toHaveURL(/\/tasks/);
  await expect(page.getByRole("heading", { level: 1, name: "وظایف" })).toBeVisible();
}

async function newPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

test("unauthenticated users are sent to login and returned to the page they wanted", async ({ page }) => {
  await page.goto("/users");
  await expect(page).toHaveURL(/\/login\?reason=expired&next=%2Fusers/);
  await page.getByLabel("ایمیل").fill("owner@example.com");
  await page.getByLabel("رمز عبور").fill(PASSWORD);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("heading", { level: 1, name: "کاربران" })).toBeVisible();
});

test("wrong credentials show a Persian error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("ایمیل").fill("owner@example.com");
  await page.getByLabel("رمز عبور").fill("wrong-password");
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByText("ایمیل یا رمز عبور نادرست است.")).toBeVisible();
});

test("auth cookies stay HttpOnly and nothing is kept in web storage", async ({ page, context }) => {
  await login(page, "owner@example.com");
  const access = (await context.cookies()).find((c) => c.name === "access_token");
  expect(access?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("access_token");
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test("task lifecycle: create with rich text, view, edit, delete", async ({ page }) => {
  const title = `وظیفهٔ آزمایشی ${Date.now()}`;
  await login(page, "manager@example.com");

  await page.getByRole("button", { name: "وظیفهٔ جدید" }).click();
  const dialog = page.getByRole("dialog", { name: "وظیفهٔ جدید" });
  await dialog.getByLabel("عنوان", { exact: true }).fill(title);
  const editor = dialog.getByRole("textbox", { name: "توضیحات" });
  await editor.click();
  await dialog.getByRole("button", { name: "پررنگ" }).click();
  await page.keyboard.type("متن پررنگ");
  await dialog.getByRole("button", { name: "ایجاد وظیفه" }).click();
  await expect(page.getByText("وظیفه ایجاد شد.")).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: title, exact: true }).click();
  const details = page.getByRole("dialog", { name: title });
  await expect(details.locator("strong", { hasText: "متن پررنگ" })).toBeVisible();

  await details.getByRole("button", { name: "ویرایش" }).click();
  const edit = page.getByRole("dialog", { name: "ویرایش وظیفه" });
  await expect(edit.locator("strong", { hasText: "متن پررنگ" })).toBeVisible();
  await edit.getByLabel("عنوان", { exact: true }).fill(`${title} (ویرایش)`);
  await edit.getByRole("button", { name: "ذخیرهٔ تغییرات" }).click();
  await expect(page.getByText("تغییرات وظیفه ذخیره شد.")).toBeVisible();

  await page.getByRole("button", { name: `گزینه‌های وظیفهٔ «${title} (ویرایش)»` }).click();
  await page.getByRole("menuitem", { name: "حذف" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "حذف وظیفه" }).click();
  await expect(page.getByText("وظیفه حذف شد.")).toBeVisible();
  await expect(page.getByRole("button", { name: `${title} (ویرایش)`, exact: true })).toHaveCount(0);
});

test("filters are reflected in the URL and survive reload", async ({ page }) => {
  await login(page, "owner@example.com");
  await page.getByRole("button", { name: /^وضعیت/ }).click();
  await page.getByRole("option", { name: "انجام‌شده" }).click();
  await expect(page).toHaveURL(/status=done/);
  await page.reload();
  await expect(page.getByRole("region", { name: /انجام‌شده/ })).toBeVisible();
  await expect(page.getByRole("region", { name: /برای انجام/ })).toHaveCount(0);
});

test("an expired access token is refreshed transparently", async ({ page, request }) => {
  await login(page, "owner@example.com");
  await request.post(`${BACKEND}/__test__/expire-access`);
  await page.reload();
  await expect(page).toHaveURL(/\/tasks/);
  await expect(page.getByRole("heading", { level: 1, name: "وظایف" })).toBeVisible();
});

test("members do not see user management and get a forbidden state", async ({ page }) => {
  await login(page, "member@example.com");
  await expect(page.getByRole("link", { name: "کاربران" })).toHaveCount(0);
  await page.goto("/users");
  await expect(page.getByText("دسترسی ندارید")).toBeVisible();
});

test("logout clears the session", async ({ page }) => {
  await login(page, "owner@example.com");
  await page.getByRole("button", { name: /سارا محمدی/ }).click();
  await page.getByRole("menuitem", { name: "خروج از حساب" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login\?reason=expired/);
});

test("a disabled user loses access on the next request and cannot log back in", async ({ page, browser }) => {
  const email = `temp-${Date.now()}@example.com`;
  await login(page, "owner@example.com");
  await page.getByRole("link", { name: "کاربران" }).click();
  await page.getByRole("button", { name: "کاربر جدید" }).click();
  const create = page.getByRole("dialog", { name: "کاربر جدید" });
  await create.getByLabel("نام و نام خانوادگی").fill("کاربر موقت");
  await create.getByLabel("ایمیل").fill(email);
  await create.getByLabel("رمز عبور اولیه").fill(PASSWORD);
  await create.getByRole("button", { name: "ایجاد کاربر" }).click();
  await expect(page.getByText("کاربر ایجاد شد.")).toBeVisible();

  const userPage = await newPage(browser);
  await login(userPage, email);

  await page.getByRole("button", { name: "گزینه‌های کاربر «کاربر موقت»" }).click();
  await page.getByRole("menuitem", { name: "غیرفعال‌سازی" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "غیرفعال‌سازی" }).click();
  await expect(page.getByText("«کاربر موقت» غیرفعال شد.")).toBeVisible();

  await userPage.reload();
  await expect(userPage).toHaveURL(/\/login\?reason=expired/);
  await userPage.getByLabel("ایمیل").fill(email);
  await userPage.getByLabel("رمز عبور").fill(PASSWORD);
  await userPage.getByRole("button", { name: "ورود" }).click();
  await expect(userPage.getByText("حساب کاربری شما غیرفعال است", { exact: false })).toBeVisible();
});

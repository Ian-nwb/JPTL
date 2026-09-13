# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.js >> E2E Test Suite — JPTL Property Management Platform >> 1. Authentication & Access Control >> 1.3 Landlord login succeeds and lands on Landlord Dashboard
- Location: tests/e2e.spec.js:24:9

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard.*/
Received string:  "http://localhost:5173/login"
Timeout: 8000ms

Call log:
  - Expect "toHaveURL" with timeout 8000ms
    20 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:5173/login"

```

```yaml
- link "JPTL.SYSTEM":
  - /url: /
- button "Toggle Light/Dark Theme"
- heading "Welcome Back." [level=1]
- paragraph: Unified access for landlords and residents. Sign in with your email and password to automatically access your management dashboard or resident portal.
- text: 2,480+ Managed Units 98.4% Occupancy Rate JPTL Unified Portal • Secure Authentication
- heading "Sign In to Your Account" [level=2]
- paragraph: Enter your credentials below to access your portal
- text: Authentication Failed Invalid email or password Email address
- textbox "Email address":
  - /placeholder: name@example.com
  - text: landlord@jptl.dev
- text: Password
- textbox "Password":
  - /placeholder: Enter your password
  - text: Password123!
- button
- button "Sign In"
- text: Need a landlord account?
- button "Create one now"
- text: Resident access is granted by your landlord or property management office.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('E2E Test Suite — JPTL Property Management Platform', () => {
  4   | 
  5   |   test.describe('1. Authentication & Access Control', () => {
  6   |     test('1.1 Should display login page with email and password inputs', async ({ page }) => {
  7   |       await page.goto('/login');
  8   |       await expect(page.locator('#login-email')).toBeVisible();
  9   |       await expect(page.locator('#login-password')).toBeVisible();
  10  |       await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  11  |     });
  12  | 
  13  |     test('1.2 Should show error when attempting login with invalid credentials', async ({ page }) => {
  14  |       await page.goto('/login');
  15  |       await page.fill('#login-email', 'invalid.user@example.com');
  16  |       await page.fill('#login-password', 'WrongPassword123!');
  17  |       await page.click('button[type="submit"]');
  18  | 
  19  |       // Expect error alert or message to appear
  20  |       const errorBanner = page.locator('text=/Invalid email or password|Authentication failed|Invalid credentials/i');
  21  |       await expect(errorBanner).toBeVisible({ timeout: 5000 });
  22  |     });
  23  | 
  24  |     test('1.3 Landlord login succeeds and lands on Landlord Dashboard', async ({ page }) => {
  25  |       await page.goto('/login');
  26  |       await page.fill('#login-email', 'landlord@jptl.dev');
  27  |       await page.fill('#login-password', 'Password123!');
  28  |       await page.click('button[type="submit"]');
  29  | 
  30  |       // Expect redirect to /dashboard
> 31  |       await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 8000 });
      |                          ^ Error: expect(page).toHaveURL(expected) failed
  32  |       await expect(page.locator('text=/Dashboard|Properties|Maintenance|Rent Roll|Tenant Directory/i').first()).toBeVisible();
  33  |     });
  34  | 
  35  |     test('1.4 Tenant login succeeds and lands on Resident Portal', async ({ page }) => {
  36  |       await page.goto('/login');
  37  |       await page.fill('#login-email', 'sophia@jptl.dev');
  38  |       await page.fill('#login-password', 'Password123!');
  39  |       await page.click('button[type="submit"]');
  40  | 
  41  |       // Expect redirect to /tenant
  42  |       await expect(page).toHaveURL(/.*tenant.*/, { timeout: 8000 });
  43  |       await expect(page.locator('text=/Resident Portal|Sophia Lin|Overview|Maintenance|Payments/i').first()).toBeVisible();
  44  |     });
  45  |   });
  46  | 
  47  |   test.describe('2. Landlord Management & Announcement Lifecycle', () => {
  48  |     test.beforeEach(async ({ page }) => {
  49  |       await page.goto('/login');
  50  |       await page.fill('#login-email', 'landlord@jptl.dev');
  51  |       await page.fill('#login-password', 'Password123!');
  52  |       await page.click('button[type="submit"]');
  53  |       await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 8000 });
  54  |     });
  55  | 
  56  |     test('2.1 Should navigate between Landlord tabs', async ({ page }) => {
  57  |       // Navigate to Properties
  58  |       const propertiesTab = page.locator('button:has-text("Properties")').first();
  59  |       if (await propertiesTab.isVisible()) {
  60  |         await propertiesTab.click();
  61  |         await expect(page.locator('text=/Add Property|All Properties|Units/i').first()).toBeVisible();
  62  |       }
  63  | 
  64  |       // Navigate to Tickets
  65  |       const ticketsTab = page.locator('button:has-text("Tickets"), button:has-text("Maintenance")').first();
  66  |       if (await ticketsTab.isVisible()) {
  67  |         await ticketsTab.click();
  68  |         await expect(page.locator('text=/Maintenance|Tickets|Status|Priority/i').first()).toBeVisible();
  69  |       }
  70  | 
  71  |       // Navigate to Announcements
  72  |       const announcementsTab = page.locator('button:has-text("Announcements")').first();
  73  |       if (await announcementsTab.isVisible()) {
  74  |         await announcementsTab.click();
  75  |         await expect(page.locator('text=/Broadcast|New Announcement|Announcements/i').first()).toBeVisible();
  76  |       }
  77  |     });
  78  | 
  79  |     test('2.2 Should broadcast an announcement and allow deletion', async ({ page }) => {
  80  |       const announcementsTab = page.locator('button:has-text("Announcements")').first();
  81  |       if (await announcementsTab.isVisible()) {
  82  |         await announcementsTab.click();
  83  | 
  84  |         // Check if there is a "New Announcement" or "Broadcast" button
  85  |         const newBtn = page.locator('button:has-text("New Announcement"), button:has-text("Broadcast")').first();
  86  |         if (await newBtn.isVisible()) {
  87  |           await newBtn.click();
  88  | 
  89  |           const titleInput = page.locator('input[placeholder*="title" i], input[name="title"]').first();
  90  |           if (await titleInput.isVisible()) {
  91  |             const testTitle = `E2E Test Notice - ${Date.now()}`;
  92  |             await titleInput.fill(testTitle);
  93  | 
  94  |             const contentInput = page.locator('textarea[placeholder*="content" i], textarea[name="content"]').first();
  95  |             if (await contentInput.isVisible()) {
  96  |               await contentInput.fill('This is an automated test notice for E2E verification.');
  97  |             }
  98  | 
  99  |             const submitBtn = page.locator('button:has-text("Post"), button:has-text("Publish"), button:has-text("Send")').first();
  100 |             if (await submitBtn.isVisible()) {
  101 |               await submitBtn.click();
  102 |               await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 6000 });
  103 | 
  104 |               // Verify delete button is present on the announcement
  105 |               const deleteBtn = page.locator(`button[aria-label*="delete" i], button:has-text("Delete")`).first();
  106 |               if (await deleteBtn.isVisible()) {
  107 |                 await deleteBtn.click();
  108 |               }
  109 |             }
  110 |           }
  111 |         }
  112 |       }
  113 |     });
  114 |   });
  115 | 
  116 |   test.describe('3. Tenant Portal Maintenance & Payments', () => {
  117 |     test.beforeEach(async ({ page }) => {
  118 |       await page.goto('/login');
  119 |       await page.fill('#login-email', 'sophia@jptl.dev');
  120 |       await page.fill('#login-password', 'Password123!');
  121 |       await page.click('button[type="submit"]');
  122 |       await expect(page).toHaveURL(/.*tenant.*/, { timeout: 8000 });
  123 |     });
  124 | 
  125 |     test('3.1 Maintenance tab displays tickets and Report Issue modal', async ({ page }) => {
  126 |       const maintTab = page.locator('button:has-text("Maintenance")').first();
  127 |       await maintTab.click();
  128 | 
  129 |       const reportBtn = page.locator('button:has-text("Report Issue"), button:has-text("New Ticket")').first();
  130 |       await expect(reportBtn).toBeVisible();
  131 | 
```
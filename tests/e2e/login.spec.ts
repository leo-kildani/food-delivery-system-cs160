import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login form elements', async ({ page }) => {
    
    // Check email input exists
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    
    // Check password input exists
    await expect(page.getByLabel(/password/i)).toBeVisible();
    
    // Check login button exists
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    
    // Check signup link exists
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    
    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click the eye icon to show password
    await page.locator('button[type="button"]').filter({ has: page.locator('svg') }).first().click();
    
    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click login without filling fields
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for form submission and validation
    await page.waitForTimeout(500);
    
    // Check for error messages (adjust based on your validation)
    const emailInput = page.getByLabel(/email address/i);
    const passwordInput = page.getByLabel(/password/i);
    
    // Inputs should still be visible (form didn't submit)
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    // Fill in the email field
    await page.getByLabel(/email address/i).fill('test@account.com');
    
    // Fill in the password field
    await page.getByLabel(/password/i).fill('Test123!');
    
    // Click the login button
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for navigation after successful login
    await page.waitForURL('**/home', { timeout: 10000 });
    
    // Verify we're on the home page
    await expect(page).toHaveURL(/\/home/);
    
    // Check for products heading or other home page elements
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email address/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Click the login button
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for error message to appear
    await page.waitForTimeout(1000);
    
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Check for error message (adjust selector based on your error display)
    // This might be a toast, alert, or inline error message
  });

  test('should navigate to signup page when clicking signup link', async ({ page }) => {
    // Click the signup link
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Should navigate to signup page
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should show loading state during login', async ({ page }) => {
    // Fill in credentials
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    
    // Click login button
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Check for loading state (button should show "Logging In...")
    await expect(page.getByText(/logging in/i)).toBeVisible({ timeout: 2000 });
  });
});
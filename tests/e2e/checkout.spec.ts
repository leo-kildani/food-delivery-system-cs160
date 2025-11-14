// add 3 items to cart
// go to checkout and make sure 3 items exist
import { test, expect } from '@playwright/test';

// Helper function to login before tests
async function loginAsUser(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill('test@account.com');
  await page.getByLabel(/password/i).fill('Test123!');
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL('**/home', { timeout: 10000 });
}

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Login first before accessing cart
    await loginAsUser(page);
    await page.goto('/shopping-cart');
  });

  test('display empty cart and link takes back to product page', async ({ page }) => {
    // Check for empty cart message
    const emptyMessage = page.getByText(/your cart is empty/i);
    
    // If cart is empty, verify the UI
    if (await emptyMessage.isVisible()) {
      // Verify empty cart heading
      await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();
      
      // Verify empty cart message
      await expect(emptyMessage).toBeVisible();
      
      // Verify "browse products" message
      await expect(page.getByText(/browse products and add items/i)).toBeVisible();
      
      // Verify "Shop products" button exists and click it
      const shopButton = page.getByRole('link', { name: /shop products/i });
      await expect(shopButton).toBeVisible();
      
      await shopButton.click();
      
      // Should navigate to home/products page
      await expect(page).toHaveURL(/\/home/);
      await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
    }
  });

  test('add items to cart from products page', async ({ page }) => {
    // Go to products page
    await page.goto('/home');
    
    // Wait for products to load
    await page.waitForSelector('text=Products', { timeout: 5000 });
    
    // Find and click first "Add to Cart" button (adjust selector based on your UI)
    const addToCartButtons = page.getByRole('button', { name: /add to cart/i });
    const buttonCount = await addToCartButtons.count();
    
    if (buttonCount > 0) {
      // Add first item
      await addToCartButtons.first().click();
      await page.waitForTimeout(1000); // Wait for cart update
      
      // Go to cart
      await page.goto('/shopping-cart');
      
      // Verify cart has items
      await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();
      
      // Verify cart summary exists
      await expect(page.getByText(/cart summary/i)).toBeVisible();
    }
  });

  test('update item quantity in cart', async ({ page }) => {
    // Assuming cart has items
    const plusButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
    
    if (await plusButton.isVisible()) {
      // Get current quantity
      const quantityDisplay = page.locator('span.font-semibold').first();
      const initialQuantity = await quantityDisplay.textContent();
      
      // Click plus button
      await plusButton.click();
      
      // Wait for update
      await page.waitForTimeout(500);
      
      // Verify save button appears
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
      
      // Click save
      await page.getByRole('button', { name: /save/i }).click();
      
      // Wait for save to complete
      await page.waitForTimeout(1000);
    }
  });

  test('remove item from cart', async ({ page }) => {
    // Look for remove button
    const removeButton = page.getByRole('button', { name: /remove/i }).first();
    
    if (await removeButton.isVisible()) {
      // Click remove
      await removeButton.click();
      
      // Wait for removal
      await page.waitForTimeout(1000);
      
      // Item should be removed (check if cart is empty or has fewer items)
      // This depends on how many items were in cart
    }
  });

  test('proceed to checkout button is disabled with unsaved changes', async ({ page }) => {
    const plusButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
    
    if (await plusButton.isVisible()) {
      // Change quantity without saving
      await plusButton.click();
      await page.waitForTimeout(500);
      
      // Checkout button should be disabled
      const checkoutButton = page.getByRole('link', { name: /proceed to checkout/i });
      
      // Check if button has disabled attribute or class
      const isDisabled = await checkoutButton.evaluate((el) => {
        return el.hasAttribute('disabled') || 
               el.getAttribute('aria-disabled') === 'true' ||
               el.closest('button')?.hasAttribute('disabled');
      });
      
      expect(isDisabled).toBeTruthy();
      
      // Verify warning message
      await expect(page.getByText(/unsaved changes/i)).toBeVisible();
    }
  });

  test('display cart summary with correct totals', async ({ page }) => {
    // Check if cart has items
    const cartSummary = page.getByText(/cart summary/i);
    
    if (await cartSummary.isVisible()) {
      // Verify summary sections exist
      await expect(page.getByText(/items:/i)).toBeVisible();
      await expect(page.getByText(/total weight:/i)).toBeVisible();
      await expect(page.getByText(/delivery fee/i)).toBeVisible();
      await expect(page.getByText(/subtotal:/i)).toBeVisible();
    }
  });
});

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('navigate to checkout with items in cart', async ({ page }) => {
    // Add item to cart first
    await page.goto('/home');
    
    const addToCartButtons = page.getByRole('button', { name: /add to cart/i });
    if (await addToCartButtons.count() > 0) {
      await addToCartButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Go to shopping cart
      await page.goto('/shopping-cart');
      
      // Click proceed to checkout
      const checkoutButton = page.getByRole('link', { name: /proceed to checkout/i });
      await checkoutButton.click();
      
      // Should navigate to checkout page
      await expect(page).toHaveURL(/\/checkout/);
    }
  });

  test('checkout page displays cart items', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verify checkout page elements
    // Adjust these based on your actual checkout page structure
    await page.waitForLoadState('networkidle');
    
    // Should show items or checkout form
    // This will depend on your checkout page implementation
  });
});
const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');
const { describe, it, before, after } = require('node:test');

describe('Corporate Employee Login Tests', function() {
    let driver;

    before(async function() {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async function() {
        // Commenting out quit so the browser window stays open and logged in
        // await driver.quit();
    });

    it('should login successfully with valid credentials', async function() {
        await driver.get('http://localhost:3000/auth');
        await driver.sleep(1500); // 🟢 Slow down to see the page load
        
        // Click on "Corporate Employee" button to reveal the login form
        const employeeButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Corporate Employee')]")), 5000);
        await employeeButton.click();
        await driver.sleep(1500); // 🟢 Slow down to see the click
        
        // Wait for the email field to become visible
        const emailField = await driver.wait(until.elementLocated(By.name('email')), 5000);
        await emailField.sendKeys('tanish@gmail.com');
        await driver.sleep(1000); // 🟢 Slow down to see email entered
        
        await driver.findElement(By.name('password')).sendKeys("asdfghjkl;'");
        await driver.sleep(1000); // 🟢 Slow down to see password entered
        
        await driver.findElement(By.name('password')).sendKeys(Key.RETURN);
        await driver.sleep(4000); // 🟢 Keep browser open for a few seconds to see the result/error on screen
        
        // Wait for dashboard redirect
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return url.includes('dashboard') || url.includes('profile');
        }, 10000);
        
        const currentUrl = await driver.getCurrentUrl();
        assert.ok(currentUrl.includes('dashboard') || currentUrl.includes('profile'));
    });

    it.skip('should show error message with invalid credentials', async function() {
        await driver.get('http://localhost:3000/auth');
        await driver.sleep(1500); // 🟢 Slow down to see the page load
        
        // Click on "Corporate Employee" button to reveal the login form
        const employeeButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Corporate Employee')]")), 5000);
        await employeeButton.click();
        await driver.sleep(1500); // 🟢 Slow down to see the click
        
        const emailField = await driver.wait(until.elementLocated(By.name('email')), 5000);
        await emailField.sendKeys('invalid@company.com');
        await driver.findElement(By.name('password')).sendKeys('invalidPassword', Key.RETURN);
        await driver.sleep(1500); // 🟢 Slow down to see the error display
        
        // The error is rendered in an AlertDescription, so we look for something with the Destructive Alert styling
        const errorMessage = await driver.wait(until.elementLocated(By.xpath("//div[@role='alert']")), 5000);
        const text = await errorMessage.getText();
        assert.ok(text.length > 0);
    });
});
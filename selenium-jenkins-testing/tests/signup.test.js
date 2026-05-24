const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');
const { describe, it, before, after } = require('node:test');

describe('Corporate Admin Signup Tests', function() {
    let driver;

    before(async function() {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async function() {
        // Commenting out quit so the browser window stays open and logged in
        // await driver.quit();
    });

    it('should create a corporate account successfully', async function() {
        await driver.get('http://localhost:3000/auth');
        await driver.sleep(1500); // 🟢 Slow down to see the page load
        
        // Click on "Corporate Admin" button to reveal the signup flow
        const adminButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Corporate Admin')]")), 5000);
        await adminButton.click();
        await driver.sleep(1000); // 🟢 Slow down to see click

        // Since the current state is "Login", click the text "Register here"
        const registerLink = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Register here')]")), 5000);
        await registerLink.click();
        await driver.sleep(1500); // 🟢 Wait for registration form

        const generatedEmail = `admin_${Date.now()}@company.com`;

        // Company Information
        const companyName = await driver.wait(until.elementLocated(By.name('companyName')), 5000);
        await companyName.sendKeys(`Corp_${Date.now()} Inc.`); // Random company name
        await driver.sleep(500);
        
        // Admin Account - The name attributes match the react-hook-form fields
        await driver.findElement(By.name('adminFirstName')).sendKeys('John');
        await driver.findElement(By.name('adminLastName')).sendKeys('Doe');
        await driver.findElement(By.name('adminEmail')).sendKeys(generatedEmail); // Make email unique each time
        await driver.findElement(By.name('adminPassword')).sendKeys('SecurePassword123!');
        await driver.findElement(By.name('confirmPassword')).sendKeys('SecurePassword123!');
        await driver.sleep(1000);

        // Company Location
        await driver.findElement(By.name('city')).sendKeys('New York');
        await driver.findElement(By.name('state')).sendKeys('NY');
        await driver.findElement(By.name('country')).sendKeys('United States');
        await driver.findElement(By.name('countryCode')).sendKeys('US');
        await driver.findElement(By.name('phoneCode')).sendKeys('+1');
        await driver.sleep(1000);

        // Location Dropdown (Select component in shadcn/ui)
        // Since there is a Subscription Plan dropdown earlier in the form, 
        // we need to make sure we select the second combobox which is for Location
        const locationTrigger = await driver.findElement(By.xpath("(//button[@role='combobox'])[2]"));
        
        // Scroll the dropdown into view before clicking it to prevent ElementClickInterceptedError
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", locationTrigger);
        await driver.sleep(1000);

        // Use JS click to guarantee the dropdown opens
        await driver.executeScript("arguments[0].click();", locationTrigger);
        await driver.sleep(1500); // 🟢 Wait longer for floating dropdown menu to attach to DOM
        
        // Use a more specific selector targeting the Shadcn UI select items
        const northAmericaOption = await driver.wait(until.elementLocated(By.xpath("//div[@role='option']//*[contains(text(), 'North America')] | //div[@role='option'][contains(text(), 'North America')]")), 5000);
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", northAmericaOption);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", northAmericaOption);
        await driver.sleep(1000);

        // Click Create Corporate Account (using Javascript click to forcefully bypass styling/intercepts)
        const createButton = await driver.findElement(By.xpath("//button[contains(., 'Create Corporate Account')]"));
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", createButton);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", createButton); 
        
        // Wait for success alert box
        const successMessage = await driver.wait(until.elementLocated(By.xpath("//div[@role='alert']")), 10000);
        const messageText = await successMessage.getText();
        
        assert.ok(messageText.includes('successfully') || messageText.includes('Account created'));
        
        await driver.sleep(3000); // Wait for the automatic redirect back to login page (your app has a 2 sec timeout)

        // NOW TEST IF WE CAN LOGIN WITH IT
        const emailLoginField = await driver.wait(until.elementLocated(By.name('email')), 10000);
        await emailLoginField.sendKeys(generatedEmail);
        await driver.sleep(500);
        
        await driver.findElement(By.name('password')).sendKeys('SecurePassword123!', Key.RETURN);
        await driver.sleep(4000); // Wait for login to process

        // Assert we got redirected to the dashboard after logging in with the newly created account 
        const currentUrl = await driver.getCurrentUrl();
        assert.ok(currentUrl.includes('dashboard') || currentUrl.includes('profile'));
        
        await driver.sleep(1000000); // 🟢 Stay on screen so it doesn't close for a very long time
    });
});
package com.uspeek.tests;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import java.time.Duration;
import java.util.Date;

public class SignupTest {
    WebDriver driver;
    WebDriverWait wait;
    JavascriptExecutor js;

    @BeforeClass
    public void setup() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        js = (JavascriptExecutor) driver;
    }

    @Test
    public void createCorporateAccountSuccessfully() throws InterruptedException {
        driver.get("http://localhost:3000/auth");
        Thread.sleep(1500);

        WebElement adminBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(., 'Corporate Admin')]")));
        adminBtn.click();
        Thread.sleep(1000);

        WebElement registerLnk = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(., 'Register here')]")));
        registerLnk.click();
        Thread.sleep(1500);

        long timestamp = new Date().getTime();
        String generatedEmail = "admin_" + timestamp + "@company.com";

        WebElement companyField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("companyName")));
        companyField.sendKeys("Corp_" + timestamp + " Inc.");
        Thread.sleep(500);

        driver.findElement(By.name("adminFirstName")).sendKeys("John");
        driver.findElement(By.name("adminLastName")).sendKeys("Doe");
        driver.findElement(By.name("adminEmail")).sendKeys(generatedEmail);
        driver.findElement(By.name("adminPassword")).sendKeys("SecurePassword123!");
        driver.findElement(By.name("confirmPassword")).sendKeys("SecurePassword123!");
        Thread.sleep(1000);

        driver.findElement(By.name("city")).sendKeys("New York");
        driver.findElement(By.name("state")).sendKeys("NY");
        driver.findElement(By.name("country")).sendKeys("United States");
        driver.findElement(By.name("countryCode")).sendKeys("US");
        driver.findElement(By.name("phoneCode")).sendKeys("+1");
        Thread.sleep(1000);

        WebElement locationTrigger = driver.findElement(By.xpath("(//button[@role='combobox'])[2]"));
        js.executeScript("arguments[0].scrollIntoView({block: 'center'});", locationTrigger);
        Thread.sleep(1000);
        js.executeScript("arguments[0].click();", locationTrigger);
        Thread.sleep(1500);

        WebElement northAmBtn = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//div[@role='option']//*[contains(text(), 'North America')] | //div[@role='option'][contains(text(), 'North America')]")));
        js.executeScript("arguments[0].scrollIntoView({block: 'center'});", northAmBtn);
        Thread.sleep(500);
        js.executeScript("arguments[0].click();", northAmBtn);
        Thread.sleep(1000);

        WebElement createBtn = driver.findElement(By.xpath("//button[contains(., 'Create Corporate Account')]"));
        js.executeScript("arguments[0].scrollIntoView({block: 'center'});", createBtn);
        Thread.sleep(500);
        js.executeScript("arguments[0].click();", createBtn);

        Thread.sleep(6000);

        WebElement alert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//div[@role='alert']")));
        String messageTXT = alert.getText();
        Assert.assertTrue(messageTXT.contains("successfully") || messageTXT.contains("Account created"), "Alert missing success message");

        Thread.sleep(3000); // Wait for redirect back to login

        // TEST LOGIN WITH IT
        WebElement loginEmail = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("email")));
        loginEmail.sendKeys(generatedEmail);
        Thread.sleep(500);
        driver.findElement(By.name("password")).sendKeys("SecurePassword123!");
        driver.findElement(By.name("password")).submit();
        Thread.sleep(4000);

        String currentUrl = driver.getCurrentUrl();
        Assert.assertTrue(currentUrl.contains("dashboard") || currentUrl.contains("profile"), "Did not redirect to dashboard");

        Thread.sleep(1000000); // Leave it open manually to observe
    }

    // @AfterClass
    // public void teardown() {
    //    if (driver != null) {
    //        driver.quit();
    //    }
    // }
}

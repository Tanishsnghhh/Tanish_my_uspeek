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

public class DashboardUITest {
    WebDriver driver;
    WebDriverWait wait;
    
    @BeforeClass
    public void setup() throws InterruptedException {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        
        // Login first
        driver.get("http://localhost:3000/auth");
        Thread.sleep(1500);

        WebElement employeeBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(., 'Corporate Employee')]")));
        employeeBtn.click();
        
        WebElement emailField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("email")));
        emailField.sendKeys("tanish@gmail.com");
        driver.findElement(By.name("password")).sendKeys("asdfghjkl;'");
        driver.findElement(By.name("password")).submit();
        
        Thread.sleep(4000);
    }
    
    @Test
    public void testDashboardNavigation() throws Exception {
        driver.get("http://localhost:3000/dashboard");
        Thread.sleep(8000); // Visual wait
        
        System.out.println("Navigated to dashboard successfully. URL: " + driver.getCurrentUrl());
        Assert.assertTrue(driver.getCurrentUrl().contains("dashboard"), "Not on dashboard page");
    }
    
    @AfterClass
    public void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }
}

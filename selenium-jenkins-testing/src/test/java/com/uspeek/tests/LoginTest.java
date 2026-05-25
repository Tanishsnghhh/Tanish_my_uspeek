package com.uspeek.tests;

import org.openqa.selenium.By;
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

public class LoginTest {
    WebDriver driver;
    WebDriverWait wait;

    @BeforeClass
    public void setup() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @Test
    public void loginSuccessfully() throws InterruptedException {
        driver.get("http://localhost:3000/auth");
        Thread.sleep(1500);

        WebElement employeeBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(., 'Corporate Employee')]")));
        employeeBtn.click();
        Thread.sleep(1500);

        WebElement emailField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("email")));
        emailField.sendKeys("tanish@gmail.com");
        Thread.sleep(1000);

        driver.findElement(By.name("password")).sendKeys("asdfghjkl;'");
        Thread.sleep(1000);
        driver.findElement(By.name("password")).submit();

        Thread.sleep(4000);

        wait.until(d -> {
            String url = d.getCurrentUrl();
            return url.contains("dashboard") || url.contains("profile");
        });

        String currentUrl = driver.getCurrentUrl();
        Assert.assertTrue(currentUrl.contains("dashboard") || currentUrl.contains("profile"), "Did not redirect to dashboard/profile");
    }

    @AfterClass
    public void teardown() {
       if (driver != null) {
           driver.quit();
       }
    }
}

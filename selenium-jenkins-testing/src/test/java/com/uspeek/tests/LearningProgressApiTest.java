package com.uspeek.tests;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

public class LearningProgressApiTest {
    WebDriver driver;

    @BeforeClass
    public void setup() {
        driver = new ChromeDriver();
    }
    
    @Test
    public void testLearningProgressEndpoint() throws Exception {
        driver.get("http://localhost:3000/api/learning-progress");
        Thread.sleep(2000);
        
        String pageSource = driver.getPageSource();
        System.out.println("Learning Progress Source: " + pageSource.length() + " chars");
        Assert.assertNotNull(pageSource, "Page source should not be null");
    }
    
    @AfterClass
    public void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }
}

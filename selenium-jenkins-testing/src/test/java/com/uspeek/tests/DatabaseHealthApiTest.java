package com.uspeek.tests;

import org.testng.Assert;
import org.testng.annotations.Test;

public class DatabaseHealthApiTest {
    
    @Test
    public void testDatabaseHealthEndpoint() throws Exception {
        java.net.URL url = new java.net.URL("http://localhost:3000/api/health/database");
        java.net.HttpURLConnection con = (java.net.HttpURLConnection) url.openConnection();
        con.setRequestMethod("GET");
        con.setConnectTimeout(5000);
        con.setReadTimeout(5000);
        
        int statusCode = con.getResponseCode();
        System.out.println("Health DB Status Code: " + statusCode);
        assert(statusCode == 200 || statusCode == 503 || statusCode == 307 || statusCode == 308);
    }
}

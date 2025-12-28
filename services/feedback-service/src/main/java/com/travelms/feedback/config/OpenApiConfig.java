package com.travelms.feedback.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI feedbackServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Feedback Service API")
                        .description("Feedback Service for Travel Management System - Handles ratings, reviews, and reports")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Travel Management System")
                                .email("support@travelms.com")));
    }
}

package com.travelms.payment.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    @Value("${server.port:8084}")
    private String serverPort;

    @Bean
    public OpenAPI paymentServiceOpenAPI() {
        Server server = new Server();
        server.setUrl("http://localhost:" + serverPort);
        server.setDescription("Payment Service");

        Contact contact = new Contact();
        contact.setName("Travel Management System");
        contact.setEmail("support@travelms.com");

        Info info = new Info()
                .title("Payment Service API")
                .version("1.0.0")
                .description("Payment Service with Stripe and PayPal integration for Travel Management System")
                .contact(contact);

        return new OpenAPI()
                .info(info)
                .servers(List.of(server));
    }
}

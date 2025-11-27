package com.ecommerce.klu.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    OpenAPI taskOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Task Management API")
                        .description("Spring Boot REST API for managing tasks")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Developer Aryan Team")
                                .email("aryan@gmaill.com")
                                .url("Git Repo URL"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://springdoc.org")));
    }
}

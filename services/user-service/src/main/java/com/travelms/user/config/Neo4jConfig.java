//package com.travelms.user.config;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.data.neo4j.config.AbstractNeo4jConfig;
//import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;
//
///**
// * Neo4j configuration for the User Service
// */
//@Configuration
//@EnableNeo4jRepositories(basePackages = "com.travelms.user.repository")
//public class Neo4jConfig extends AbstractNeo4jConfig {
//
//    @Value("${spring.neo4j.uri}")
//    private String uri;
//
//    @Value("${spring.neo4j.authentication.username}")
//    private String username;
//
//    @Value("${spring.neo4j.authentication.password}")
//    private String password;
//
//    @Override
//    @Bean
//    public org.neo4j.driver.Driver driver() {
//        return org.neo4j.driver.GraphDatabase.driver(uri,
//                org.neo4j.driver.AuthTokens.basic(username, password));
//    }
//}
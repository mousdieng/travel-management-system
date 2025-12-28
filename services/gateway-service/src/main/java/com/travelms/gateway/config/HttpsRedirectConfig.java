package com.travelms.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.netty.http.server.HttpServer;

/**
 * Configuration for HTTP to HTTPS redirect
 */
@Configuration
public class HttpsRedirectConfig {

    @Value("${server.port:9443}")
    private int httpsPort;

    @Value("${server.http.port:9080}")
    private int httpPort;

    @Value("${server.ssl.enabled:true}")
    private boolean sslEnabled;

    @Bean
    public WebServerFactoryCustomizer<NettyReactiveWebServerFactory> httpToHttpsRedirect() {
        return factory -> {
            if (sslEnabled) {
                factory.addServerCustomizers((HttpServer httpServer) ->
                        httpServer.port(httpPort)
                                .httpRequestDecoder(spec -> spec.maxInitialLineLength(16384))
                );
            }
        };
    }
}

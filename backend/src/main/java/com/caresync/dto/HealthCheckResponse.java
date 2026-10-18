package com.caresync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthCheckResponse {
    private String status;
    private String appName;
    private String version;
    private LocalDateTime timestamp;

    public static HealthCheckResponseBuilder builder() {
        return new HealthCheckResponseBuilder();
    }

    public static class HealthCheckResponseBuilder {
        private String status;
        private String appName;
        private String version;
        private LocalDateTime timestamp;

        public HealthCheckResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public HealthCheckResponseBuilder appName(String appName) {
            this.appName = appName;
            return this;
        }

        public HealthCheckResponseBuilder version(String version) {
            this.version = version;
            return this;
        }

        public HealthCheckResponseBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public HealthCheckResponse build() {
            return new HealthCheckResponse(status, appName, version, timestamp);
        }
    }
}

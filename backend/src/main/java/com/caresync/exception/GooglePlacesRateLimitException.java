package com.caresync.exception;

import lombok.Getter;

@Getter
public class GooglePlacesRateLimitException extends RuntimeException {

    private final long retryAfterSeconds;

    public GooglePlacesRateLimitException(long retryAfterSeconds, String message) {
        super(message);
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }
}

package com.caresync.exception;

public class GooglePlacesMonthlyLimitExceededException extends RuntimeException {
    public GooglePlacesMonthlyLimitExceededException(String message) {
        super(message);
    }
}

package com.caresync.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class GooglePlacesApiException extends RuntimeException {

    private final HttpStatus status;

    public GooglePlacesApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}

package com.caresync.exception;

import org.springframework.security.core.AuthenticationException;

public class OAuth2AccountConflictException extends AuthenticationException {

    public OAuth2AccountConflictException(String message) {
        super(message);
    }

    public OAuth2AccountConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}

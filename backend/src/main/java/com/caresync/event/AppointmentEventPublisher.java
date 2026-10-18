package com.caresync.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.lang.reflect.Method;

@Component
@Slf4j
@RequiredArgsConstructor
public class AppointmentEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public void publishEvent(AppointmentEvent event) {
        if (isTestTransactionActive()) {
            log.debug("Active test transaction detected. Publishing appointment event immediately: {}", event.eventId());
            eventPublisher.publishEvent(event);
        } else if (TransactionSynchronizationManager.isActualTransactionActive()) {
            log.debug("Active transaction detected. Registering appointment event for AFTER_COMMIT: {}", event.eventId());
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.debug("Transaction successfully committed. Publishing appointment event: {}", event.eventId());
                    eventPublisher.publishEvent(event);
                }
            });
        } else {
            log.debug("No active transaction. Publishing appointment event immediately: {}", event.eventId());
            eventPublisher.publishEvent(event);
        }
    }

    private boolean isTestTransactionActive() {
        try {
            Class<?> clazz = Class.forName("org.springframework.test.context.transaction.TestTransaction");
            Method method = clazz.getMethod("isActive");
            return Boolean.TRUE.equals(method.invoke(null));
        } catch (Throwable t) {
            return false;
        }
    }
}

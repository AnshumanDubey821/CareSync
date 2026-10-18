package com.caresync.event;

import com.caresync.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class AppointmentEventListener {

    private final EmailService emailService;
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    @EventListener
    public void onAppointmentEvent(AppointmentEvent event) {
        log.info("Processing appointment event: [type={}, eventId={}, appointmentId={}]",
                event.eventType(), event.eventId(), event.appointmentId());

        // Deduplication safeguard: drop repeated event processing
        if (!processedEventIds.add(event.eventId())) {
            log.warn("Duplicate appointment event detected and skipped: {}", event.eventId());
            return;
        }

        emailService.sendAppointmentEventNotifications(event);
    }

    public boolean isEventProcessed(String eventId) {
        return processedEventIds.contains(eventId);
    }

    public void clearProcessedEvents() {
        processedEventIds.clear();
    }
}

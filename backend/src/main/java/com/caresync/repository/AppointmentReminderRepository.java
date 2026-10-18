package com.caresync.repository;

import com.caresync.model.entity.AppointmentReminder;
import com.caresync.model.enums.ReminderStatus;
import com.caresync.model.enums.ReminderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppointmentReminderRepository extends JpaRepository<AppointmentReminder, Long> {

    Optional<AppointmentReminder> findByAppointmentIdAndReminderType(Long appointmentId, ReminderType reminderType);

    boolean existsByAppointmentIdAndReminderTypeAndStatus(Long appointmentId, ReminderType reminderType, ReminderStatus status);

    void deleteByAppointmentId(Long appointmentId);
}

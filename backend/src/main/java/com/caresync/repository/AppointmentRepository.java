package com.caresync.repository;

import com.caresync.model.entity.Appointment;
import com.caresync.model.enums.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(Long doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate appointmentDate);

    boolean existsByDoctorIdAndAppointmentDateAndStartTimeAndStatusNot(
            Long doctorId, LocalDate appointmentDate, LocalTime startTime, AppointmentStatus excludedStatus);

    boolean existsByPatientIdAndAppointmentDateAndStartTimeAndStatusNot(
            Long patientId, LocalDate appointmentDate, LocalTime startTime, AppointmentStatus excludedStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :appointmentDate AND a.startTime = :startTime AND a.status <> 'CANCELLED'")
    Optional<Appointment> findSlotForBookingWithLock(
            @Param("doctorId") Long doctorId,
            @Param("appointmentDate") LocalDate appointmentDate,
            @Param("startTime") LocalTime startTime);

    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient p JOIN FETCH p.user JOIN FETCH a.doctor d JOIN FETCH d.user WHERE a.appointmentDate = :targetDate AND a.reminderSent = false AND a.status IN :statuses")
    List<Appointment> findAppointmentsNeedingReminder(
            @Param("targetDate") LocalDate targetDate,
            @Param("statuses") List<AppointmentStatus> statuses);

    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient p JOIN FETCH p.user JOIN FETCH a.doctor d JOIN FETCH d.user WHERE a.appointmentDate BETWEEN :startDate AND :endDate AND a.status IN :statuses")
    List<Appointment> findUpcomingAppointmentsByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<AppointmentStatus> statuses);

    long countByStatus(AppointmentStatus status);
}

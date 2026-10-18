package com.caresync.repository;

import com.caresync.model.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    List<DoctorAvailability> findByDoctorIdAndActiveTrue(Long doctorId);

    List<DoctorAvailability> findByDoctorIdAndAvailableDateAndActiveTrue(Long doctorId, LocalDate availableDate);

    @Query("SELECT COUNT(a) > 0 FROM DoctorAvailability a WHERE a.doctor.id = :doctorId AND a.active = true AND " +
           "((:availableDate IS NOT NULL AND a.availableDate = :availableDate) OR " +
           " (:dayOfWeek IS NOT NULL AND a.dayOfWeek = :dayOfWeek)) AND " +
           "(:excludeId IS NULL OR a.id <> :excludeId) AND " +
           ":startTime < a.endTime AND :endTime > a.startTime")
    boolean existsOverlappingAvailability(
            @Param("doctorId") Long doctorId,
            @Param("availableDate") LocalDate availableDate,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);
}

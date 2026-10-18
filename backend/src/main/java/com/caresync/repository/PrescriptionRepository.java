package com.caresync.repository;

import com.caresync.model.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);

    List<Prescription> findByPatientId(Long patientId);

    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Prescription> findByDoctorId(Long doctorId);

    List<Prescription> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
}

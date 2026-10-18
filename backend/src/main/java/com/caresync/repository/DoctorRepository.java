package com.caresync.repository;

import com.caresync.model.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    @Query("SELECT d FROM Doctor d JOIN d.user u WHERE " +
           "(:name IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%'))) AND " +
           "(:specialization IS NULL OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', CAST(:specialization AS string), '%'))) AND " +
           "(:location IS NULL OR LOWER(d.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%')))")
    List<Doctor> searchDoctors(@Param("name") String name,
                              @Param("specialization") String specialization,
                              @Param("location") String location);
}

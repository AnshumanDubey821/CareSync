package com.caresync.repository;

import com.caresync.entity.GooglePlacesUsage;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GooglePlacesUsageRepository extends JpaRepository<GooglePlacesUsage, String> {

    /**
     * Finds usage record for year_month with a pessimistic write lock
     * to safely prevent concurrent requests from exceeding the configured limit.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM GooglePlacesUsage u WHERE u.yearMonth = :yearMonth")
    Optional<GooglePlacesUsage> findByYearMonthForUpdate(@Param("yearMonth") String yearMonth);
}

package com.caresync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalDoctors;
    private long totalPatients;
    private long totalAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private long scheduledAppointments;
}

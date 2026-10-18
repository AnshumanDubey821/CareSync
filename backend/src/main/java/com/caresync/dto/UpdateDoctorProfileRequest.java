package com.caresync.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDoctorProfileRequest {

    private String fullName;
    private String phoneNumber;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Qualifications are required")
    private String qualifications;

    @Min(value = 0, message = "Experience years cannot be negative")
    private Integer experienceYears;

    private String bio;

    private String location;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Consultation fee cannot be negative")
    private BigDecimal consultationFee;
}

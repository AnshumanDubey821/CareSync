package com.caresync.dto.places;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceSearchRequest {

    @NotBlank(message = "Search query cannot be blank")
    @Size(min = 2, max = 100, message = "Query length must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s.,'-]+$", message = "Query contains invalid characters")
    private String query;

    @Size(max = 60, message = "City name must not exceed 60 characters")
    @Pattern(regexp = "^[a-zA-Z\\s.-]*$", message = "City contains invalid characters")
    private String city;

    /**
     * Whitelisted Place types: "hospital", "doctor", "health", "medical_clinic", "pharmacy".
     */
    @Pattern(regexp = "^(hospital|doctor|health|medical_clinic|pharmacy)?$", message = "Invalid place type filter")
    private String placeType;

    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 20, message = "Page size cannot exceed 20")
    @Builder.Default
    private int pageSize = 10;

    @Size(max = 500, message = "Page token is too long")
    private String pageToken;
}

package com.caresync.dto.places;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceSummaryDto {

    private String id;
    private String displayName;
    private String formattedAddress;
    private Double rating;
    private Integer userRatingCount;
    private Double latitude;
    private Double longitude;
    private String primaryType;
    private String googleMapsUri;
    private List<String> photoUrls;
}

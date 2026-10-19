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
public class PlaceDetailDto {

    private String id;
    private String displayName;
    private String formattedAddress;
    private String nationalPhoneNumber;
    private String internationalPhoneNumber;
    private String websiteUri;
    private Double rating;
    private Integer userRatingCount;
    private Double latitude;
    private Double longitude;
    private String primaryType;
    private String googleMapsUri;
    private List<String> photoUrls;
    private String attribution;
}

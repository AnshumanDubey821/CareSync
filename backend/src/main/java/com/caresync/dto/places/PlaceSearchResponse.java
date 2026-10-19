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
public class PlaceSearchResponse {

    private List<PlaceSummaryDto> places;
    private int totalFound;
    private boolean cached;
    private String attribution;
}

package com.travelms.travel.dto;

import com.travelms.travel.service.RecommendationService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for post-subscription travel suggestions
 * Contains similar, trending, and personalized travel recommendations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelSuggestionsDTO {
    private List<TravelDTO> similar;
    private List<TravelDTO> trending;
    private List<RecommendationService.TravelRecommendationDTO> personalized;
}

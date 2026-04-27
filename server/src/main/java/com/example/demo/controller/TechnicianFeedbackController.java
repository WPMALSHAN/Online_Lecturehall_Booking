package com.example.demo.controller;

import com.example.demo.dto.FeedbackResponse;
import com.example.demo.entity.TechnicianFeedback;
import com.example.demo.service.TechnicianFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TechnicianFeedbackController {

    private final TechnicianFeedbackService feedbackService;

    // POST /api/feedback/incident/{incidentId}
    // Admin submits feedback + rating for a resolved incident
    @PostMapping("/incident/{incidentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @PathVariable Long incidentId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {

        int rating  = Integer.parseInt(String.valueOf(body.getOrDefault("rating", 3)));
        String comment = String.valueOf(body.getOrDefault("comment", ""));

        TechnicianFeedback saved = feedbackService.submitFeedback(incidentId, rating, comment, auth.getName());
        return ResponseEntity.ok(FeedbackResponse.from(saved));
    }

    // GET /api/feedback/my
    // Technician views own feedback
    @GetMapping("/my")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<FeedbackResponse>> getMyFeedback(Authentication auth) {
        List<FeedbackResponse> list = feedbackService.getMyFeedback(auth.getName())
                .stream().map(FeedbackResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // GET /api/feedback/my/summary
    // Technician views own rating summary (avg + count)
    @GetMapping("/my/summary")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<Map<String, Object>> getMySummary(Authentication auth) {
        return ResponseEntity.ok(feedbackService.getTechnicianSummary(auth.getName()));
    }

    // GET /api/feedback/technician/{id}
    // Admin views feedback for a specific technician
    @GetMapping("/technician/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackResponse>> getByTechnician(@PathVariable Long id) {
        List<FeedbackResponse> list = feedbackService.getFeedbackByTechnicianId(id)
                .stream().map(FeedbackResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // GET /api/feedback/incident/{incidentId}/exists
    // Check if feedback already exists for an incident (for UI state)
    @GetMapping("/incident/{incidentId}/exists")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> checkExists(@PathVariable Long incidentId) {
        return ResponseEntity.ok(
                Map.of("exists", feedbackService.hasExistingFeedback(incidentId))
        );
    }
}

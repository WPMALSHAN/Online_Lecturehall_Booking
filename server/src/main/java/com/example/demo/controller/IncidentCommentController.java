package com.example.demo.controller;

import com.example.demo.dto.IncidentCommentRequest;
import com.example.demo.dto.IncidentCommentResponse;
import com.example.demo.service.IncidentCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IncidentCommentController {

    private final IncidentCommentService incidentCommentService;

    @GetMapping("/{incidentId}/comments")
    public ResponseEntity<List<IncidentCommentResponse>> getComments(
            @PathVariable Long incidentId,
            Authentication auth) {

        return ResponseEntity.ok(incidentCommentService.getComments(incidentId, auth.getName()));
    }

    @PostMapping("/{incidentId}/comments")
    public ResponseEntity<IncidentCommentResponse> addComment(
            @PathVariable Long incidentId,
            @Valid @RequestBody IncidentCommentRequest request,
            Authentication auth) {

        IncidentCommentResponse response = incidentCommentService.addComment(incidentId, request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<IncidentCommentResponse> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody IncidentCommentRequest request,
            Authentication auth) {

        return ResponseEntity.ok(incidentCommentService.updateComment(commentId, request, auth.getName()));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable Long commentId,
            Authentication auth) {

        incidentCommentService.deleteComment(commentId, auth.getName());
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }
}


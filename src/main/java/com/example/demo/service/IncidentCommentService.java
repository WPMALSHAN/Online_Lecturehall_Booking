package com.example.demo.service;

import com.example.demo.dto.IncidentCommentRequest;
import com.example.demo.dto.IncidentCommentResponse;
import com.example.demo.entity.Incident;
import com.example.demo.entity.IncidentComment;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.IncidentCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidentCommentService {

    private final IncidentCommentRepository incidentCommentRepository;
    private final IncidentService incidentService;
    private final NotificationService notificationService;

    @Transactional
    public IncidentCommentResponse addComment(Long incidentId, IncidentCommentRequest request, String actorEmail) {
        User actor = incidentService.getUserByEmail(actorEmail);
        Incident incident = incidentService.findIncidentById(incidentId);
        incidentService.assertCanAccessIncident(actor, incident);

        IncidentComment comment = IncidentComment.builder()
                .incident(incident)
                .author(actor)
                .message(request.getMessage().trim())
                .build();

        IncidentComment saved = incidentCommentRepository.save(comment);
        notifyCommentParticipants(incident, actor);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<IncidentCommentResponse> getComments(Long incidentId, String actorEmail) {
        User actor = incidentService.getUserByEmail(actorEmail);
        Incident incident = incidentService.findIncidentById(incidentId);
        incidentService.assertCanAccessIncident(actor, incident);

        return incidentCommentRepository.findByIncidentOrderByCreatedAtAsc(incident)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public IncidentCommentResponse updateComment(Long commentId, IncidentCommentRequest request, String actorEmail) {
        User actor = incidentService.getUserByEmail(actorEmail);
        IncidentComment comment = incidentCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!canModifyComment(actor, comment)) {
            throw new AccessDeniedException("Only comment owner or admin can update comments");
        }

        comment.setMessage(request.getMessage().trim());
        return toResponse(incidentCommentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, String actorEmail) {
        User actor = incidentService.getUserByEmail(actorEmail);
        IncidentComment comment = incidentCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!canModifyComment(actor, comment)) {
            throw new AccessDeniedException("Only comment owner or admin can delete comments");
        }

        incidentCommentRepository.delete(comment);
    }

    private boolean canModifyComment(User actor, IncidentComment comment) {
        return actor.getRole() == User.Role.ADMIN || comment.getAuthor().getId().equals(actor.getId());
    }

    private void notifyCommentParticipants(Incident incident, User actor) {
        User reporter = incident.getReportedBy();
        User technician = incident.getAssignedTechnician();

        String message = "New comment added to incident #" + incident.getId();

        if (reporter != null && !reporter.getId().equals(actor.getId())) {
            notificationService.createNotification(reporter, message);
        }

        if (technician != null && !technician.getId().equals(actor.getId())) {
            notificationService.createNotification(technician, message);
        }
    }

    private IncidentCommentResponse toResponse(IncidentComment comment) {
        return IncidentCommentResponse.builder()
                .id(comment.getId())
                .incidentId(comment.getIncident().getId())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getName())
                .authorRole(comment.getAuthor().getRole().name())
                .message(comment.getMessage())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}


package com.example.demo.service;

import com.example.demo.dto.AssignTechnicianRequest;
import com.example.demo.dto.CreateIncidentRequest;
import com.example.demo.dto.IncidentResponse;
import com.example.demo.dto.UpdateIncidentStatusRequest;
import com.example.demo.entity.Incident;
import com.example.demo.entity.IncidentAttachment;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.IncidentAttachmentRepository;
import com.example.demo.repository.IncidentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentAttachmentRepository incidentAttachmentRepository;
    private final UserRepository userRepository;
    private final IncidentAttachmentStorageService attachmentStorageService;
    private final NotificationService notificationService;

    private static final Map<Incident.Status, EnumSet<Incident.Status>> TRANSITIONS = Map.of(
            Incident.Status.OPEN, EnumSet.of(Incident.Status.IN_PROGRESS, Incident.Status.REJECTED),
            Incident.Status.IN_PROGRESS, EnumSet.of(Incident.Status.RESOLVED, Incident.Status.REJECTED),
            Incident.Status.RESOLVED, EnumSet.of(Incident.Status.CLOSED),
            Incident.Status.CLOSED, EnumSet.noneOf(Incident.Status.class),
            Incident.Status.REJECTED, EnumSet.noneOf(Incident.Status.class)
    );

    @Transactional
    public IncidentResponse createIncident(String reporterEmail, CreateIncidentRequest request, List<MultipartFile> attachments) {
        User reporter = getUserByEmail(reporterEmail);

        Incident incident = Incident.builder()
                .reportedBy(reporter)
                .location(request.getLocation())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .preferredContact(request.getPreferredContact())
                .status(Incident.Status.OPEN)
                .build();

        Incident savedIncident = incidentRepository.save(incident);
        List<IncidentAttachment> savedAttachments = attachmentStorageService.saveAttachments(savedIncident, attachments);

        if (!savedAttachments.isEmpty()) {
            savedIncident.getAttachments().addAll(savedAttachments);
        }

        return toResponse(savedIncident);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidents(String actorEmail, Incident.Status status) {
        User actor = getUserByEmail(actorEmail);

        List<Incident> incidents;
        if (actor.getRole() == User.Role.ADMIN) {
            incidents = (status == null)
                    ? incidentRepository.findAll()
                    : incidentRepository.findByStatusOrderByCreatedAtDesc(status);
        } else if (actor.getRole() == User.Role.TECHNICIAN) {
            incidents = incidentRepository.findByAssignedTechnicianOrderByCreatedAtDesc(actor);
        } else {
            incidents = incidentRepository.findByReportedByOrderByCreatedAtDesc(actor);
        }

        return incidents.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public IncidentResponse getIncidentById(Long incidentId, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = findIncidentById(incidentId);
        assertCanAccessIncident(actor, incident);
        return toResponse(incident);
    }

    @Transactional
    public IncidentResponse assignTechnician(Long incidentId, AssignTechnicianRequest request, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        if (actor.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can assign technicians");
        }

        Incident incident = findIncidentById(incidentId);
        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id: " + request.getTechnicianId()));

        if (technician.getRole() != User.Role.TECHNICIAN) {
            throw new RuntimeException("Selected user is not a technician");
        }

        incident.setAssignedTechnician(technician);
        Incident updated = incidentRepository.save(incident);

        notificationService.createNotification(technician,
                "You have been assigned to incident #" + incident.getId());
        notificationService.createNotification(incident.getReportedBy(),
                "A technician was assigned to your incident #" + incident.getId());

        return toResponse(updated);
    }

    @Transactional
    public IncidentResponse updateStatus(Long incidentId, UpdateIncidentStatusRequest request, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = findIncidentById(incidentId);

        assertCanChangeStatus(actor, incident, request.getStatus());
        assertValidTransition(incident.getStatus(), request.getStatus());

        if (request.getStatus() == Incident.Status.REJECTED) {
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new RuntimeException("Reason is required when rejecting an incident");
            }
            incident.setRejectionReason(request.getReason().trim());
        }

        if (request.getStatus() == Incident.Status.RESOLVED) {
            if (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank()) {
                throw new RuntimeException("Resolution notes are required when resolving an incident");
            }
            incident.setResolutionNotes(request.getResolutionNotes().trim());
            incident.setResolvedAt(LocalDateTime.now());
        }

        if (request.getStatus() == Incident.Status.CLOSED) {
            incident.setClosedAt(LocalDateTime.now());
        }

        if (request.getStatus() != Incident.Status.REJECTED) {
            incident.setRejectionReason(null);
        }

        incident.setStatus(request.getStatus());
        Incident updated = incidentRepository.save(incident);

        if (!actor.getId().equals(incident.getReportedBy().getId())) {
            notificationService.createNotification(incident.getReportedBy(),
                    "Your incident #" + incident.getId() + " status changed to " + incident.getStatus());
        }

        return toResponse(updated);
    }

    @Transactional
    public IncidentResponse addAttachments(Long incidentId, List<MultipartFile> attachments, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = findIncidentById(incidentId);
        assertCanAccessIncident(actor, incident);

        List<IncidentAttachment> savedAttachments = attachmentStorageService.saveAttachments(incident, attachments);
        incident.getAttachments().addAll(savedAttachments);
        return toResponse(incidentRepository.save(incident));
    }

    @Transactional
    public void deleteAttachment(Long incidentId, Long attachmentId, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = findIncidentById(incidentId);
        IncidentAttachment attachment = incidentAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id: " + attachmentId));

        if (!attachment.getIncident().getId().equals(incident.getId())) {
            throw new RuntimeException("Attachment does not belong to this incident");
        }

        if (actor.getRole() != User.Role.ADMIN && !incident.getReportedBy().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the reporter or admin can delete attachments");
        }

        attachmentStorageService.deleteAttachment(attachment);
    }

    @Transactional(readOnly = true)
    public IncidentAttachment getAttachment(Long incidentId, Long attachmentId, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = findIncidentById(incidentId);
        assertCanAccessIncident(actor, incident);

        IncidentAttachment attachment = incidentAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id: " + attachmentId));

        if (!attachment.getIncident().getId().equals(incident.getId())) {
            throw new RuntimeException("Attachment does not belong to this incident");
        }

        return attachment;
    }

    public Incident findIncidentById(Long incidentId) {
        return incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public void assertCanAccessIncident(User actor, Incident incident) {
        boolean isAdmin = actor.getRole() == User.Role.ADMIN;
        boolean isReporter = incident.getReportedBy() != null && incident.getReportedBy().getId().equals(actor.getId());
        boolean isAssignedTechnician = incident.getAssignedTechnician() != null
                && incident.getAssignedTechnician().getId().equals(actor.getId());

        if (!isAdmin && !isReporter && !isAssignedTechnician) {
            throw new AccessDeniedException("You do not have access to this incident");
        }
    }

    private void assertCanChangeStatus(User actor, Incident incident, Incident.Status targetStatus) {
        if (actor.getRole() == User.Role.ADMIN) {
            return;
        }

        if (actor.getRole() == User.Role.TECHNICIAN
                && incident.getAssignedTechnician() != null
                && incident.getAssignedTechnician().getId().equals(actor.getId())) {
            if (targetStatus == Incident.Status.IN_PROGRESS || targetStatus == Incident.Status.RESOLVED) {
                return;
            }
            throw new AccessDeniedException("Technicians can only mark incidents as IN_PROGRESS or RESOLVED");
        }

        throw new AccessDeniedException("You are not allowed to change incident status");
    }

    private void assertValidTransition(Incident.Status currentStatus, Incident.Status targetStatus) {
        if (currentStatus == targetStatus) {
            return;
        }

        EnumSet<Incident.Status> allowed = TRANSITIONS.get(currentStatus);
        if (allowed == null || !allowed.contains(targetStatus)) {
            throw new RuntimeException("Invalid status transition from " + currentStatus + " to " + targetStatus);
        }
    }

    public IncidentResponse toResponse(Incident incident) {
        List<IncidentResponse.AttachmentInfo> attachmentInfos = incident.getAttachments() == null
                ? List.of()
                : incident.getAttachments().stream()
                .map(attachment -> IncidentResponse.AttachmentInfo.builder()
                        .id(attachment.getId())
                        .originalFileName(attachment.getOriginalFileName())
                        .contentType(attachment.getContentType())
                        .fileSize(attachment.getFileSize())
                .previewDataUrl(buildPreviewDataUrl(attachment))
                        .build())
                .toList();

        return IncidentResponse.builder()
                .id(incident.getId())
                .reportedById(incident.getReportedBy() == null ? null : incident.getReportedBy().getId())
                .reportedByName(incident.getReportedBy() == null ? null : incident.getReportedBy().getName())
                .assignedTechnicianId(incident.getAssignedTechnician() == null ? null : incident.getAssignedTechnician().getId())
                .assignedTechnicianName(incident.getAssignedTechnician() == null ? null : incident.getAssignedTechnician().getName())
                .location(incident.getLocation())
                .category(incident.getCategory())
                .description(incident.getDescription())
                .priority(incident.getPriority())
                .status(incident.getStatus())
                .preferredContact(incident.getPreferredContact())
                .rejectionReason(incident.getRejectionReason())
                .resolutionNotes(incident.getResolutionNotes())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .resolvedAt(incident.getResolvedAt())
                .closedAt(incident.getClosedAt())
                .attachments(attachmentInfos)
                .build();
    }

    private String buildPreviewDataUrl(IncidentAttachment attachment) {
        try {
            byte[] bytes = Files.readAllBytes(Path.of(attachment.getFilePath()));
            String contentType = attachment.getContentType() == null ? "application/octet-stream" : attachment.getContentType();
            return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception ex) {
            return null;
        }
    }
}


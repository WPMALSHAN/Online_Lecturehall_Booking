package com.example.demo.controller;

import com.example.demo.dto.AssignTechnicianRequest;
import com.example.demo.dto.CreateIncidentRequest;
import com.example.demo.dto.IncidentResponse;
import com.example.demo.dto.UpdateIncidentStatusRequest;
import com.example.demo.entity.Incident;
import com.example.demo.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<IncidentResponse> createIncidentJson(
            Authentication auth,
            @Valid @RequestBody CreateIncidentRequest request) {

        IncidentResponse response = incidentService.createIncident(auth.getName(), request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentResponse> createIncident(
            Authentication auth,
            @Valid @RequestPart("data") CreateIncidentRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        IncidentResponse response = incidentService.createIncident(auth.getName(), request, attachments);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<IncidentResponse>> getIncidents(
            Authentication auth,
            @RequestParam(name = "status", required = false) Incident.Status status) {

        return ResponseEntity.ok(incidentService.getIncidents(auth.getName(), status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncidentById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(incidentService.getIncidentById(id, auth.getName()));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<IncidentResponse> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTechnicianRequest request,
            Authentication auth) {

        return ResponseEntity.ok(incidentService.assignTechnician(id, request, auth.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidentStatusRequest request,
            Authentication auth) {

        return ResponseEntity.ok(incidentService.updateStatus(id, request, auth.getName()));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentResponse> addAttachments(
            @PathVariable Long id,
            @RequestPart("attachments") List<MultipartFile> attachments,
            Authentication auth) {

        return ResponseEntity.ok(incidentService.addAttachments(id, attachments, auth.getName()));
    }

    @DeleteMapping("/{incidentId}/attachments/{attachmentId}")
    public ResponseEntity<Map<String, String>> deleteAttachment(
            @PathVariable Long incidentId,
            @PathVariable Long attachmentId,
            Authentication auth) {

        incidentService.deleteAttachment(incidentId, attachmentId, auth.getName());
        return ResponseEntity.ok(Map.of("message", "Attachment deleted successfully"));
    }

    @GetMapping("/{incidentId}/attachments/{attachmentId}")
    public ResponseEntity<Resource> getAttachment(
            @PathVariable Long incidentId,
            @PathVariable Long attachmentId,
            Authentication auth) {

        var attachment = incidentService.getAttachment(incidentId, attachmentId, auth.getName());
        Path path = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();

        try {
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(attachment.getContentType()))
                    .header("Content-Disposition", "inline; filename=\"" + attachment.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to load attachment", ex);
        }
    }
}

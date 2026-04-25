

package com.example.demo.controller;

import com.example.demo.dto.IncidentRequest;
import com.example.demo.entity.Incident;
import com.example.demo.entity.TechnicianUpdate;
import com.example.demo.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IncidentController {

    private final IncidentService incidentService;

    // POST /api/incidents - any logged in user can report
    @PostMapping
    public ResponseEntity<Incident> create(
            @Valid @RequestBody IncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.createIncident(request, auth.getName()));
    }

    // GET /api/incidents/my - get my incidents
    @GetMapping("/my")
    public ResponseEntity<List<Incident>> getMyIncidents(Authentication auth) {
        return ResponseEntity.ok(incidentService.getMyIncidents(auth.getName()));
    }

    // GET /api/incidents - get all incidents (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Incident>> getAll() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    // GET /api/incidents/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Incident> getById(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    // GET /api/incidents/status/{status} - filter by status (Admin)
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Incident>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(incidentService.getByStatus(status));
    }

    // GET /api/incidents/assigned - technician sees own assigned incidents
    @GetMapping("/assigned")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<Incident>> getAssigned(Authentication auth) {
        return ResponseEntity.ok(incidentService.getMyAssignedIncidents(auth.getName()));
    }

    // PUT /api/incidents/{id}/assign - Admin assigns technician
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> assign(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        Long technicianId = body.get("technicianId");
        return ResponseEntity.ok(incidentService.assignTechnician(id, technicianId));
    }

    // POST /api/incidents/{id}/updates - technician adds update
    @PostMapping("/{id}/updates")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<TechnicianUpdate> addUpdate(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String updateText = body.get("updateText");
        return ResponseEntity.ok(incidentService.addUpdate(id, updateText, auth.getName()));
    }

    // GET /api/incidents/{id}/updates - get all updates for incident
    @GetMapping("/{id}/updates")
    public ResponseEntity<List<TechnicianUpdate>> getUpdates(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.getUpdates(id));
    }

    // PUT /api/incidents/{id}/resolve - technician marks resolved
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<Incident> resolve(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.markResolved(id, auth.getName()));
    }

    // PUT /api/incidents/{id}/close - Admin closes incident
    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> close(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.closeIncident(id));
    }

    // PUT /api/incidents/{id}/reject - Admin rejects incident
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> reject(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.rejectIncident(id));
    }
}
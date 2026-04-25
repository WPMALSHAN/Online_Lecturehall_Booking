package com.example.demo.controller;

import com.example.demo.entity.Facility;
import com.example.demo.service.FacilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacilityController {

    private final FacilityService facilityService;

    // GET /api/facilities - everyone can see
    @GetMapping
    public ResponseEntity<List<Facility>> getAll() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    // GET /api/facilities/active - only active facilities
    @GetMapping("/active")
    public ResponseEntity<List<Facility>> getActive() {
        return ResponseEntity.ok(facilityService.getActiveFacilities());
    }

    // GET /api/facilities/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Facility> getById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    // GET /api/facilities/search?type=lab
    @GetMapping("/search")
    public ResponseEntity<List<Facility>> search(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer capacity) {

        if (type != null) {
            return ResponseEntity.ok(facilityService.getByType(type));
        }
        if (capacity != null) {
            return ResponseEntity.ok(facilityService.getByCapacity(capacity));
        }
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    // POST /api/facilities - Admin only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> create(@RequestBody Facility facility) {
        return ResponseEntity.ok(facilityService.createFacility(facility));
    }

    // PUT /api/facilities/{id} - Admin only
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> update(@PathVariable Long id,
                                           @RequestBody Facility facility) {
        return ResponseEntity.ok(facilityService.updateFacility(id, facility));
    }

    // DELETE /api/facilities/{id} - Admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.ok(Map.of("message", "Facility deleted successfully"));
    }
}
package com.example.demo.controller;

import com.example.demo.entity.Asset;
import com.example.demo.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetService assetService;

    // GET /api/assets - everyone can see
    @GetMapping
    public ResponseEntity<List<Asset>> getAll() {
        return ResponseEntity.ok(assetService.getAllAssets());
    }

    // GET /api/assets/active - only active assets
    @GetMapping("/active")
    public ResponseEntity<List<Asset>> getActive() {
        return ResponseEntity.ok(assetService.getActiveAssets());
    }

    // GET /api/assets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Asset> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getAssetById(id));
    }

    // GET /api/assets/search?category=projector
    @GetMapping("/search")
    public ResponseEntity<List<Asset>> search(
            @RequestParam(required = false) String category) {

        if (category != null) {
            return ResponseEntity.ok(assetService.getByCategory(category));
        }
        return ResponseEntity.ok(assetService.getAllAssets());
    }

    // POST /api/assets - Admin only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Asset> create(@RequestBody Asset asset) {
        return ResponseEntity.ok(assetService.createAsset(asset));
    }

    // PUT /api/assets/{id} - Admin only
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Asset> update(@PathVariable Long id,
                                        @RequestBody Asset asset) {
        return ResponseEntity.ok(assetService.updateAsset(id, asset));
    }

    // DELETE /api/assets/{id} - Admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ResponseEntity.ok(Map.of("message", "Asset deleted successfully"));
    }
}
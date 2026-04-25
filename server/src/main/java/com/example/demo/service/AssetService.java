package com.example.demo.service;

import com.example.demo.entity.Asset;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;

    // Get all assets
    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    // Get one asset
    public Asset getAssetById(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
    }

    // Create asset (Admin only)
    public Asset createAsset(Asset asset) {
        asset.setStatus(Asset.Status.ACTIVE);
        return assetRepository.save(asset);
    }

    // Update asset (Admin only)
    public Asset updateAsset(Long id, Asset updated) {
        Asset asset = getAssetById(id);
        asset.setName(updated.getName());
        asset.setCategory(updated.getCategory());
        asset.setLocation(updated.getLocation());
        asset.setStatus(updated.getStatus());
        return assetRepository.save(asset);
    }

    // Delete asset (Admin only)
    public void deleteAsset(Long id) {
        if (!assetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Asset not found with id: " + id);
        }
        assetRepository.deleteById(id);
    }

    // Search by category
    public List<Asset> getByCategory(String category) {
        return assetRepository.findByCategory(category);
    }

    // Get only active assets
    public List<Asset> getActiveAssets() {
        return assetRepository.findByStatus(Asset.Status.ACTIVE);
    }
}
package com.example.demo.service;

import com.example.demo.entity.Incident;
import com.example.demo.entity.IncidentAttachment;
import com.example.demo.repository.IncidentAttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentAttachmentStorageService {

    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png", "image/jpeg", "image/jpg", "image/webp"
    );

    @Value("${app.upload.dir:uploads/incidents}")
    private String uploadDir;

    private final IncidentAttachmentRepository incidentAttachmentRepository;

    public List<IncidentAttachment> saveAttachments(Incident incident, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        long existingCount = incidentAttachmentRepository.countByIncident(incident);
        if (existingCount + files.size() > MAX_ATTACHMENTS_PER_TICKET) {
            throw new RuntimeException("A ticket can contain at most 3 image attachments");
        }

        Path incidentDir = getIncidentDirectory(incident.getId());
        try {
            Files.createDirectories(incidentDir);
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize upload directory", e);
        }

        List<IncidentAttachment> attachments = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            validateFile(file);

            String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename());
            String storedFileName = UUID.randomUUID() + "_" + originalName.replace(" ", "_");
            Path targetPath = incidentDir.resolve(storedFileName);

            try {
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save attachment: " + originalName, e);
            }

            attachments.add(IncidentAttachment.builder()
                    .incident(incident)
                    .originalFileName(originalName)
                    .storedFileName(storedFileName)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .filePath(targetPath.toString())
                    .build());
        }

        return incidentAttachmentRepository.saveAll(attachments);
    }

    public void deleteAttachment(IncidentAttachment attachment) {
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete attachment file", e);
        }
        incidentAttachmentRepository.delete(attachment);
    }

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Only PNG, JPG, JPEG, or WEBP image files are allowed");
        }
    }

    private Path getIncidentDirectory(Long incidentId) {
        return Paths.get(uploadDir).toAbsolutePath().normalize().resolve("incident-" + incidentId);
    }
}


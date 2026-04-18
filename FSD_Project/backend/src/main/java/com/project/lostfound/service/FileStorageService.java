package com.project.lostfound.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path rootDir;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String storeItemImage(MultipartFile file) {
        return store(file, "items");
    }

    public String storeFoundReportImage(MultipartFile file) {
        return store(file, "found-reports");
    }

    private String store(MultipartFile file, String subdir) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Only JPG, PNG, or WEBP images are allowed.");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "image" : file.getOriginalFilename());
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) {
            ext = original.substring(dot).toLowerCase();
        }
        if (ext.isBlank()) {
            ext = contentType.equalsIgnoreCase("image/png") ? ".png" : ".jpg";
        }

        try {
            Path dir = rootDir.resolve(subdir).normalize();
            Files.createDirectories(dir);

            String filename = UUID.randomUUID() + ext;
            Path target = dir.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + subdir + "/" + filename;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store image.", ex);
        }
    }
}


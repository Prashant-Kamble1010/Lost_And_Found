package com.project.lostfound.service;

import com.project.lostfound.exception.UnauthorizedActionException;
import com.project.lostfound.model.Notification;
import com.project.lostfound.model.FoundReport;
import com.project.lostfound.model.User;
import com.project.lostfound.repository.NotificationRepository;
import com.project.lostfound.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void createNotification(Long userId, Long itemId, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setItemId(itemId);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    public void createFoundNotification(Long userId, Long itemId, FoundReport report, String itemName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        String itemLabel = itemName == null || itemName.isBlank() ? "item" : itemName.trim();
        String reporterDisplay = resolveReporterDisplayName(report);

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setItemId(itemId);
        notification.setFoundReportId(report.getId());
        notification.setFinderName(reporterDisplay);
        notification.setFinderContactInfo(report.getContactInfo());
        notification.setFoundImage(report.getImage());
        notification.setMessage(
                reporterDisplay + " reported your lost item \"" + itemLabel + "\" as FOUND.");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    private String resolveReporterDisplayName(FoundReport report) {
        if (report.getReportedBy() == null) {
            return "Someone";
        }
        User reporter = report.getReportedBy();
        if (reporter.getName() != null && !reporter.getName().isBlank()) {
            return reporter.getName().trim();
        }
        if (reporter.getEmail() != null && !reporter.getEmail().isBlank()) {
            return reporter.getEmail().trim();
        }
        return "Someone";
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found."));
        if (notification.getUser() == null || !notification.getUser().getId().equals(userId)) {
            throw new UnauthorizedActionException("You cannot update this notification.");
        }
        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}

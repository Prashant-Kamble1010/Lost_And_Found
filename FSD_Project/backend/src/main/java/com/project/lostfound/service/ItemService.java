package com.project.lostfound.service;

import com.project.lostfound.exception.UnauthorizedActionException;
import com.project.lostfound.model.FoundReport;
import com.project.lostfound.model.Item;
import com.project.lostfound.model.ItemStatus;
import com.project.lostfound.model.User;
import com.project.lostfound.repository.FoundReportRepository;
import com.project.lostfound.repository.ItemRepository;
import com.project.lostfound.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final FoundReportRepository foundReportRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public ItemService(
            ItemRepository itemRepository,
            UserRepository userRepository,
            FoundReportRepository foundReportRepository,
            FileStorageService fileStorageService,
            NotificationService notificationService) {
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.foundReportRepository = foundReportRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    public Item createLostItem(
            Long userId,
            String name,
            String description,
            String category,
            String contactInfo,
            String location,
            MultipartFile imageFile) {

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Name is required.");
        }
        if (category == null || category.isBlank()) {
            throw new RuntimeException("Category is required.");
        }
        if (location == null || location.isBlank()) {
            throw new RuntimeException("Location is required.");
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found."));
        String imagePath = fileStorageService.storeItemImage(imageFile);

        Item item = new Item();
        item.setName(name.trim());
        item.setDescription(description);
        item.setCategory(category.trim());
        item.setContactInfo(contactInfo);
        item.setLocation(location.trim());
        item.setImage(imagePath);
        item.setCreatedBy(user);
        item.setStatus(ItemStatus.LOST);
        item.setCreatedAt(LocalDateTime.now());
        return itemRepository.save(item);
    }

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public List<Item> getMyItems(Long userId) {
        return itemRepository.findOwnedByUser(userId);
    }

    public List<Item> getOtherUsersItems(Long userId) {
        return itemRepository.findNotOwnedByUser(userId);
    }

    public Item getItemById(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> new RuntimeException("Item not found."));
    }

    @Transactional
    public Item updateItemWithOwnershipCheck(
            Long id,
            Long userId,
            String name,
            String description,
            String category,
            String contactInfo,
            String location,
            ItemStatus status,
            MultipartFile imageFile) {
        Item item = getItemById(id);
        ensureOwner(item, userId);

        if (name != null && !name.isBlank()) {
            item.setName(name.trim());
        }
        if (description != null) {
            item.setDescription(description);
        }
        if (category != null && !category.isBlank()) {
            item.setCategory(category.trim());
        }
        if (contactInfo != null) {
            item.setContactInfo(contactInfo);
        }
        if (location != null && !location.isBlank()) {
            item.setLocation(location.trim());
        }
        if (status != null) {
            item.setStatus(status);
        }
        String newImage = fileStorageService.storeItemImage(imageFile);
        if (newImage != null) {
            item.setImage(newImage);
        }
        return itemRepository.save(item);
    }

    @Transactional
    public void deleteItemWithOwnershipCheck(Long id, Long userId) {
        Item item = getItemById(id);
        ensureOwner(item, userId);
        // Must remove dependent rows first (FK found_reports.item_id -> items.id)
        foundReportRepository.deleteAllByItemId(id);
        itemRepository.delete(item);
    }

    @Transactional
    public FoundReport reportFound(Long itemId, Long reporterUserId, MultipartFile imageFile, String contactInfo) {
        Item item = getItemById(itemId);
        Long ownerId = resolveOwnerUserId(item);
        if (ownerId != null && Objects.equals(ownerId, reporterUserId)) {
            throw new UnauthorizedActionException("You cannot report your own item as found.");
        }

        User reporter = userRepository.findById(reporterUserId).orElseThrow(() -> new RuntimeException("User not found."));
        String imagePath = fileStorageService.storeFoundReportImage(imageFile);
        if (imagePath == null) {
            throw new RuntimeException("Image is required.");
        }
        if (contactInfo == null || contactInfo.isBlank()) {
            throw new RuntimeException("Contact info is required.");
        }

        FoundReport report = new FoundReport();
        report.setItem(item);
        report.setReportedBy(reporter);
        report.setImage(imagePath);
        report.setContactInfo(contactInfo);
        report.setCreatedAt(LocalDateTime.now());
        FoundReport saved = foundReportRepository.save(report);

        item.setStatus(ItemStatus.FOUND);
        itemRepository.save(item);

        if (ownerId != null) {
            notificationService.createFoundNotification(ownerId, item.getId(), saved, item.getName());
        }

        return saved;
    }

    private void ensureOwner(Item item, Long userId) {
        Long ownerId = resolveOwnerUserId(item);
        if (ownerId == null || !Objects.equals(ownerId, userId)) {
            throw new UnauthorizedActionException("You are not allowed to modify this item.");
        }
    }

    private Long resolveOwnerUserId(Item item) {
        if (item.getCreatedBy() != null) {
            return item.getCreatedBy().getId();
        }
        if (item.getLegacyOwner() != null) {
            return item.getLegacyOwner().getId();
        }
        return null;
    }
}

package com.project.lostfound.service;

import com.project.lostfound.dto.AuthLoginRequest;
import com.project.lostfound.dto.AuthRegisterRequest;
import com.project.lostfound.dto.AuthResponse;
import com.project.lostfound.model.User;
import com.project.lostfound.repository.UserRepository;
import java.util.Optional;
import com.project.lostfound.security.JwtService;
import com.project.lostfound.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(AuthRegisterRequest req) {
        if (req.getName() == null || req.getName().isBlank()
                || req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            throw new RuntimeException("Name, email and password are required.");
        }

        Optional<User> existingUser = userRepository.findByEmail(req.getEmail());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email already exists.");
        }

        User user = new User();
        user.setName(req.getName().trim());
        user.setEmail(req.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole("USER");

        User savedUser = userRepository.save(user);
        UserPrincipal principal = new UserPrincipal(savedUser);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole());
    }

    public AuthResponse login(AuthLoginRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            throw new RuntimeException("Email and password are required.");
        }

        String email = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        boolean ok = passwordEncoder.matches(req.getPassword(), user.getPassword());
        // Backward-compat: older DB rows may have plain text passwords from earlier version.
        if (!ok && user.getPassword() != null && user.getPassword().equals(req.getPassword())) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user = userRepository.save(user);
            ok = true;
        }
        if (!ok) {
            throw new RuntimeException("Invalid email or password.");
        }

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return new AuthResponse(
                token,
                principal.getId(),
                principal.getName(),
                principal.getUsername(),
                principal.getRole());
    }
}

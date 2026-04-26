package com.example.demo.service;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.ForgotPasswordRequest;
import com.example.demo.dto.Loginrequest;
import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.registerrequest;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final int RESET_TOKEN_EXPIRY_MINUTES = 15;
    private final Map<String, PasswordResetTokenData> passwordResetTokens = new ConcurrentHashMap<>();

    private static class PasswordResetTokenData {
        private final String email;
        private final LocalDateTime expiresAt;

        private PasswordResetTokenData(String email, LocalDateTime expiresAt) {
            this.email = email;
            this.expiresAt = expiresAt;
        }
    }

    public AuthResponse register(registerrequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.valueOf(request.getRole()));

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(Loginrequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole().name());
    }

    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Email is required");
        }

        cleanupExpiredTokens();

        userRepository.findByEmail(request.getEmail().trim()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES);
            passwordResetTokens.put(token, new PasswordResetTokenData(user.getEmail(), expiresAt));

            // Replace this with an email sender integration in production.
            System.out.println("[PASSWORD RESET TOKEN] " + user.getEmail() + " -> " + token);
        });

        return Map.of(
                "message", "If your account exists, password reset instructions were generated.",
                "note", "For development only, check backend logs for the reset token."
        );
    }

    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new RuntimeException("Reset token is required");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        cleanupExpiredTokens();

        PasswordResetTokenData tokenData = passwordResetTokens.get(request.getToken().trim());
        if (tokenData == null || tokenData.expiresAt.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token is invalid or expired");
        }

        User user = userRepository.findByEmail(tokenData.email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokens.remove(request.getToken().trim());

        return Map.of("message", "Password has been reset successfully");
    }

    private void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        passwordResetTokens.entrySet().removeIf(entry -> entry.getValue().expiresAt.isBefore(now));
    }
}

package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // ─── Password reset ───────────────────────────────────────────────────────
    public void sendResetToken(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Smart Campus - Password Reset Token");
        message.setText(
                "Hello,\n\n" +
                "Your password reset token is:\n\n" +
                "👉  " + token + "\n\n" +
                "This token expires in 15 minutes.\n\n" +
                "Smart Campus Team"
        );
        mailSender.send(message);
    }

    // ─── Account blocked ─────────────────────────────────────────────────────
    public void sendAccountBlocked(String toEmail, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Smart Campus - Your Account Has Been Blocked");
        message.setText(
                "Dear " + userName + ",\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "  ⚠️  ACCOUNT BLOCKED\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "We are writing to inform you that your Smart Campus account\n" +
                "has been BLOCKED by an administrator.\n\n" +
                "While your account is blocked, you will not be able to:\n" +
                "  • Log in to the Smart Campus portal\n" +
                "  • Make or view facility bookings\n" +
                "  • Submit or track incidents\n\n" +
                "If you believe this is a mistake or would like further\n" +
                "information, please contact the campus administration team.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "Smart Campus Administration\n" +
                "This is an automated message — please do not reply.\n"
        );
        mailSender.send(message);
    }

    // ─── Account unblocked ───────────────────────────────────────────────────
    public void sendAccountUnblocked(String toEmail, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Smart Campus - Your Account Has Been Reinstated");
        message.setText(
                "Dear " + userName + ",\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "  ✅  ACCOUNT REINSTATED\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Great news! Your Smart Campus account has been UNBLOCKED\n" +
                "by an administrator. You can now log in and use all campus\n" +
                "services as normal.\n\n" +
                "What you can do now:\n" +
                "  • Log in to the Smart Campus portal\n" +
                "  • Book campus facilities\n" +
                "  • Report and track maintenance incidents\n\n" +
                "If you have any questions, please reach out to the\n" +
                "campus administration team.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "Smart Campus Administration\n" +
                "This is an automated message — please do not reply.\n"
        );
        mailSender.send(message);
    }
}
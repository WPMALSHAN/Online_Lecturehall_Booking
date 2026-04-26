package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

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
}
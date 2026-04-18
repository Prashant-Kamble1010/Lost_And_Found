package com.project.lostfound.dto;

import lombok.Data;

@Data
public class AuthLoginRequest {
    private String email;
    private String password;
}


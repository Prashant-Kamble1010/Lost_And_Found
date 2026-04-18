package com.project.lostfound.dto;

import lombok.Data;

@Data
public class AuthRegisterRequest {
    private String name;
    private String email;
    private String password;
}


package com.trato.controller;

import com.trato.dto.AuthDtos.CadastroRequest;
import com.trato.dto.AuthDtos.LoginRequest;
import com.trato.dto.AuthDtos.LoginResponse;
import com.trato.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest dados) {
        return authService.entrar(dados.getEmail(), dados.getSenha());
    }

    @PostMapping("/cadastro")
    public LoginResponse cadastro(@RequestBody CadastroRequest dados) {
        return authService.cadastrar(dados);
    }
}

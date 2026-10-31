package com.trato.controller;

import com.trato.dto.AuthDtos.LoginResponse;
import com.trato.dto.AuthDtos.NegocioDTO;
import com.trato.dto.AuthDtos.SenhaRequest;
import com.trato.dto.AuthDtos.UsuarioDTO;
import com.trato.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Endpoints de perfil/conta, usados pelo Onboarding e pela tela de
 *  Configurações. Mantido simples: sem autenticação real, só o usuário
 *  identificado pelo header X-Usuario-Id (ver UsuarioAtualResolver). */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final AuthService authService;

    public UsuarioController(AuthService authService) {
        this.authService = authService;
    }

    /** Usado na tela de Onboarding para gravar o nicho escolhido. */
    @PutMapping("/{id}")
    public UsuarioDTO atualizar(@PathVariable Long id, @RequestBody Map<String, String> dados) {
        return authService.atualizar(id, dados.get("nicho"));
    }

    /** Configurações → aba Perfil. */
    @PutMapping("/{id}/perfil")
    public UsuarioDTO atualizarPerfil(@PathVariable Long id, @RequestBody Map<String, String> dados) {
        return authService.atualizarPerfil(id, dados.get("nome"), dados.get("nomeProfissional"), dados.get("telefone"));
    }

    /** Configurações → aba Negócio. */
    @PutMapping("/{id}/negocio")
    public UsuarioDTO atualizarNegocio(@PathVariable Long id, @RequestBody NegocioDTO dados) {
        return authService.atualizarNegocio(id, dados);
    }

    /** Configurações → alterar senha. */
    @PutMapping("/{id}/senha")
    public LoginResponse alterarSenha(@PathVariable Long id, @RequestBody SenhaRequest dados) {
        return authService.alterarSenha(id, dados.getSenhaAtual(), dados.getNovaSenha());
    }
}

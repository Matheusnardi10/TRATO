package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.NotificacaoDTO;
import com.trato.service.NotificacaoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public NotificacaoController(NotificacaoService notificacaoService, UsuarioAtualResolver usuarioAtualResolver) {
        this.notificacaoService = notificacaoService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping
    public List<NotificacaoDTO> listar(HttpServletRequest request) {
        return notificacaoService.listar(usuarioAtualResolver.resolver(request));
    }

    @GetMapping("/nao-lidas")
    public Map<String, Long> contarNaoLidas(HttpServletRequest request) {
        return Map.of("quantidade", notificacaoService.contarNaoLidas(usuarioAtualResolver.resolver(request)));
    }

    @PatchMapping("/{id}/lida")
    public void marcarComoLida(@PathVariable Long id, HttpServletRequest request) {
        notificacaoService.marcarComoLida(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/marcar-todas-lidas")
    public void marcarTodasComoLidas(HttpServletRequest request) {
        notificacaoService.marcarTodasComoLidas(usuarioAtualResolver.resolver(request));
    }
}

package com.trato.controller;

import com.trato.dto.ContratoPublicoDTO;
import com.trato.service.ContratoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints que o cliente usa pelo link do e-mail — sem login. O contrato é
 * achado pelo token aleatório do link (nunca pelo id), então ninguém
 * consegue abrir contratos de outras pessoas trocando números na URL.
 */
@RestController
@RequestMapping("/api/publico/contratos")
public class PublicoContratoController {

    private final ContratoService contratoService;

    public PublicoContratoController(ContratoService contratoService) {
        this.contratoService = contratoService;
    }

    @GetMapping("/{token}")
    public ContratoPublicoDTO buscar(@PathVariable String token) {
        return contratoService.buscarPublico(token);
    }

    @PostMapping("/{token}/aprovar")
    public ContratoPublicoDTO aprovar(@PathVariable String token, HttpServletRequest request) {
        return contratoService.aprovarPeloCliente(token, ipDe(request));
    }

    private String ipDe(HttpServletRequest request) {
        String encaminhado = request.getHeader("X-Forwarded-For");
        if (encaminhado != null && !encaminhado.isBlank()) return encaminhado.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}

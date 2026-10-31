package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.RelatorioDtos.*;
import com.trato.service.RelatorioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public RelatorioController(RelatorioService relatorioService, UsuarioAtualResolver usuarioAtualResolver) {
        this.relatorioService = relatorioService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping("/servicos-mais-rentaveis")
    public List<ServicoRentavelDTO> servicosMaisRentaveis(@RequestParam(defaultValue = "10") int quantidade, HttpServletRequest request) {
        return relatorioService.servicosMaisRentaveis(usuarioAtualResolver.resolver(request), quantidade);
    }

    @GetMapping("/clientes-por-movimentacao")
    public List<ClienteMovimentacaoDTO> clientesPorMovimentacao(@RequestParam(defaultValue = "10") int quantidade, HttpServletRequest request) {
        return relatorioService.clientesPorMovimentacao(usuarioAtualResolver.resolver(request), quantidade);
    }

    @GetMapping("/orcamentos-por-status")
    public List<StatusOrcamentoDTO> orcamentosPorStatus(HttpServletRequest request) {
        return relatorioService.orcamentosPorStatus(usuarioAtualResolver.resolver(request));
    }

    @GetMapping("/previsto-x-realizado")
    public List<PrevistoRealizadoDTO> previstoXRealizado(HttpServletRequest request) {
        return relatorioService.previstoXRealizado(usuarioAtualResolver.resolver(request));
    }

    @GetMapping("/lucro-por-hora")
    public List<LucroPorHoraDTO> lucroPorHora(HttpServletRequest request) {
        return relatorioService.lucroPorHora(usuarioAtualResolver.resolver(request));
    }
}

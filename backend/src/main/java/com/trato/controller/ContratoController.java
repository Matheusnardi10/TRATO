package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.ContratoDTO;
import com.trato.dto.ContratoDTO.AditivoDTO;
import com.trato.dto.ContratoDTO.ClausulaDTO;
import com.trato.dto.ServicoDTO;
import com.trato.service.ContratoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contratos")
public class ContratoController {

    private final ContratoService contratoService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public ContratoController(ContratoService contratoService, UsuarioAtualResolver usuarioAtualResolver) {
        this.contratoService = contratoService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping
    public List<ContratoDTO> listar(@RequestParam(required = false) String status, HttpServletRequest request) {
        return contratoService.listar(usuarioAtualResolver.resolver(request), status);
    }

    @GetMapping("/{id}")
    public ContratoDTO buscar(@PathVariable Long id, HttpServletRequest request) {
        return contratoService.buscar(usuarioAtualResolver.resolver(request), id);
    }

    /** Gera (ou devolve, se já existir) o contrato de um orçamento. */
    @PostMapping("/gerar-de-orcamento/{orcamentoId}")
    public ContratoDTO gerarDoOrcamento(@PathVariable Long orcamentoId, HttpServletRequest request) {
        return contratoService.gerarDoOrcamento(usuarioAtualResolver.resolver(request), orcamentoId);
    }

    @PostMapping("/{id}/enviar-aceite")
    public ContratoDTO enviarParaAceite(@PathVariable Long id, HttpServletRequest request) {
        return contratoService.enviarParaAceite(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/marcar-aceito")
    public ContratoDTO marcarAceito(@PathVariable Long id, HttpServletRequest request) {
        return contratoService.marcarAceito(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/concluir")
    public ContratoDTO concluir(@PathVariable Long id, HttpServletRequest request) {
        return contratoService.concluir(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/cancelar")
    public ContratoDTO cancelar(@PathVariable Long id, HttpServletRequest request) {
        return contratoService.cancelar(usuarioAtualResolver.resolver(request), id);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id, HttpServletRequest request) {
        contratoService.excluir(usuarioAtualResolver.resolver(request), id);
    }

    @PutMapping("/{id}/dados")
    public ContratoDTO atualizarDados(@PathVariable Long id, @RequestBody java.util.Map<String, String> dados, HttpServletRequest request) {
        return contratoService.atualizarDados(usuarioAtualResolver.resolver(request), id, dados);
    }

    @PutMapping("/{id}/clausulas")
    public ContratoDTO atualizarClausulas(@PathVariable Long id, @RequestBody List<ClausulaDTO> clausulas, HttpServletRequest request) {
        return contratoService.atualizarClausulas(usuarioAtualResolver.resolver(request), id, clausulas);
    }

    @PostMapping("/{id}/aditivos")
    public ContratoDTO adicionarAditivo(@PathVariable Long id, @RequestBody AditivoDTO dados, HttpServletRequest request) {
        return contratoService.adicionarAditivo(usuarioAtualResolver.resolver(request), id, dados);
    }

    @DeleteMapping("/{id}/aditivos/{aditivoId}")
    public ContratoDTO removerAditivo(@PathVariable Long id, @PathVariable Long aditivoId, HttpServletRequest request) {
        return contratoService.removerAditivo(usuarioAtualResolver.resolver(request), id, aditivoId);
    }

    /** Botão "Criar serviço" da tela de contrato. Corpo opcional: { "data": "2026-10-20", "hora": "09:00" }. */
    @PostMapping("/{id}/criar-servico")
    public ServicoDTO criarServico(@PathVariable Long id, @RequestBody(required = false) Map<String, String> dados, HttpServletRequest request) {
        String data = dados == null ? null : dados.get("data");
        String hora = dados == null ? null : dados.get("hora");
        return contratoService.criarServico(usuarioAtualResolver.resolver(request), id, data, hora);
    }
}

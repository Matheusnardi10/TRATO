package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.OrcamentoDTO;
import com.trato.service.OrcamentoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orcamentos")
public class OrcamentoController {

    private final OrcamentoService orcamentoService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public OrcamentoController(OrcamentoService orcamentoService, UsuarioAtualResolver usuarioAtualResolver) {
        this.orcamentoService = orcamentoService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping
    public List<OrcamentoDTO> listar(@RequestParam(required = false) String status, HttpServletRequest request) {
        return orcamentoService.listar(usuarioAtualResolver.resolver(request), status);
    }

    @GetMapping("/{id}")
    public OrcamentoDTO buscar(@PathVariable Long id, HttpServletRequest request) {
        return orcamentoService.buscar(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping
    public OrcamentoDTO criar(@RequestBody OrcamentoDTO dados, HttpServletRequest request) {
        return orcamentoService.criar(usuarioAtualResolver.resolver(request), dados);
    }

    @PutMapping("/{id}")
    public OrcamentoDTO atualizar(@PathVariable Long id, @RequestBody OrcamentoDTO dados, HttpServletRequest request) {
        return orcamentoService.atualizar(usuarioAtualResolver.resolver(request), id, dados);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id, HttpServletRequest request) {
        orcamentoService.excluir(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/enviar")
    public OrcamentoDTO enviar(@PathVariable Long id, HttpServletRequest request) {
        return orcamentoService.enviar(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/aprovar")
    public OrcamentoDTO aprovar(@PathVariable Long id, HttpServletRequest request) {
        return orcamentoService.aprovar(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/recusar")
    public OrcamentoDTO recusar(@PathVariable Long id, HttpServletRequest request) {
        return orcamentoService.recusar(usuarioAtualResolver.resolver(request), id);
    }
}

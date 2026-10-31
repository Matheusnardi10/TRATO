package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.DespesaDTO;
import com.trato.dto.PagamentoDTO;
import com.trato.dto.ServicoDTO;
import com.trato.service.ServicoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final ServicoService servicoService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public ServicoController(ServicoService servicoService, UsuarioAtualResolver usuarioAtualResolver) {
        this.servicoService = servicoService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping
    public List<ServicoDTO> listar(@RequestParam(required = false) String status, HttpServletRequest request) {
        return servicoService.listar(usuarioAtualResolver.resolver(request), status);
    }

    @GetMapping("/{id}")
    public ServicoDTO buscar(@PathVariable Long id, HttpServletRequest request) {
        return servicoService.buscar(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping
    public ServicoDTO criar(@RequestBody ServicoDTO dados, HttpServletRequest request) {
        return servicoService.criar(usuarioAtualResolver.resolver(request), dados);
    }

    @PutMapping("/{id}")
    public ServicoDTO atualizar(@PathVariable Long id, @RequestBody ServicoDTO dados, HttpServletRequest request) {
        return servicoService.atualizar(usuarioAtualResolver.resolver(request), id, dados);
    }

    @PatchMapping("/{id}/status")
    public ServicoDTO alterarStatus(@PathVariable Long id, @RequestBody Map<String, String> dados, HttpServletRequest request) {
        return servicoService.alterarStatus(usuarioAtualResolver.resolver(request), id, dados.get("status"));
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id, HttpServletRequest request) {
        servicoService.excluir(usuarioAtualResolver.resolver(request), id);
    }

    @GetMapping("/{id}/despesas")
    public List<DespesaDTO> listarDespesas(@PathVariable Long id, HttpServletRequest request) {
        return servicoService.listarDespesas(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/despesas")
    public DespesaDTO adicionarDespesa(@PathVariable Long id, @RequestBody DespesaDTO dados, HttpServletRequest request) {
        return servicoService.adicionarDespesa(usuarioAtualResolver.resolver(request), id, dados);
    }

    @GetMapping("/{id}/pagamento")
    public PagamentoDTO pagamento(@PathVariable Long id, HttpServletRequest request) {
        return servicoService.buscarPagamento(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping("/{id}/pagamento/recebimento")
    public PagamentoDTO registrarRecebimento(@PathVariable Long id, @RequestBody Map<String, Object> dados, HttpServletRequest request) {
        double valor = dados.get("valor") == null ? 0 : Double.parseDouble(String.valueOf(dados.get("valor")));
        String forma = (String) dados.get("forma");
        return servicoService.registrarRecebimento(usuarioAtualResolver.resolver(request), id, valor, forma);
    }
}

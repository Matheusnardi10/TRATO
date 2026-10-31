package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.FinanceiroDtos.CategoriaDespesaDTO;
import com.trato.dto.FinanceiroDtos.PontoFluxoCaixaDTO;
import com.trato.dto.FinanceiroDtos.ResumoFinanceiroDTO;
import com.trato.dto.PagamentoDTO;
import com.trato.service.FinanceiroService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/financeiro")
public class FinanceiroController {

    private final FinanceiroService financeiroService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public FinanceiroController(FinanceiroService financeiroService, UsuarioAtualResolver usuarioAtualResolver) {
        this.financeiroService = financeiroService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping("/resumo")
    public ResumoFinanceiroDTO resumo(@RequestParam(required = false) String periodo, HttpServletRequest request) {
        return financeiroService.resumo(usuarioAtualResolver.resolver(request), periodo);
    }

    @GetMapping("/despesas-por-categoria")
    public List<CategoriaDespesaDTO> despesasPorCategoria(@RequestParam(required = false) String periodo, HttpServletRequest request) {
        return financeiroService.despesasPorCategoria(usuarioAtualResolver.resolver(request), periodo);
    }

    @GetMapping("/fluxo-caixa")
    public List<PontoFluxoCaixaDTO> fluxoCaixa(@RequestParam(defaultValue = "30") int dias, HttpServletRequest request) {
        return financeiroService.fluxoCaixa(usuarioAtualResolver.resolver(request), dias);
    }

    /** Contas a receber/pagar da tela de Financeiro. */
    @GetMapping("/pagamentos")
    public List<PagamentoDTO> pagamentos(HttpServletRequest request) {
        return financeiroService.listarPagamentos(usuarioAtualResolver.resolver(request));
    }
}

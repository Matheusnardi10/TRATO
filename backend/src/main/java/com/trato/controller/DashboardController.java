package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.DashboardDtos.AlertaDTO;
import com.trato.dto.DashboardDtos.HistoricoMesDTO;
import com.trato.dto.DashboardDtos.ResumoMesDTO;
import com.trato.service.DashboardService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public DashboardController(DashboardService dashboardService, UsuarioAtualResolver usuarioAtualResolver) {
        this.dashboardService = dashboardService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping("/resumo-mes")
    public ResumoMesDTO resumoMes(HttpServletRequest request) {
        return dashboardService.resumoMes(usuarioAtualResolver.resolver(request));
    }

    @GetMapping("/historico")
    public List<HistoricoMesDTO> historico(HttpServletRequest request) {
        return dashboardService.historico(usuarioAtualResolver.resolver(request));
    }

    @GetMapping("/alertas")
    public List<AlertaDTO> alertas(HttpServletRequest request) {
        return dashboardService.alertas(usuarioAtualResolver.resolver(request));
    }
}

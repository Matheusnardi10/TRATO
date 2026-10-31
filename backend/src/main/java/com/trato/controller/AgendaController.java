package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.ServicoDTO;
import com.trato.service.ServicoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Agenda do Trato: não existe uma entidade "Agendamento" separada — exatamente
 * como no app original (js/services.js → ScheduleService), um agendamento é
 * simplesmente um Serviço com data e hora. Este controller só expõe esses
 * mesmos serviços sob o nome "agendamentos", mais a verificação de conflito
 * de horário, para a tela de Agenda do Angular.
 */
@RestController
@RequestMapping("/api/agendamentos")
public class AgendaController {

    private final ServicoService servicoService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public AgendaController(ServicoService servicoService, UsuarioAtualResolver usuarioAtualResolver) {
        this.servicoService = servicoService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping
    public List<ServicoDTO> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            HttpServletRequest request) {
        return servicoService.listarPorPeriodo(usuarioAtualResolver.resolver(request), inicio, fim);
    }

    @PostMapping
    public ServicoDTO criar(@RequestBody ServicoDTO dados, HttpServletRequest request) {
        return servicoService.criar(usuarioAtualResolver.resolver(request), dados);
    }

    @PutMapping("/{id}")
    public ServicoDTO atualizar(@PathVariable Long id, @RequestBody ServicoDTO dados, HttpServletRequest request) {
        return servicoService.atualizar(usuarioAtualResolver.resolver(request), id, dados);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id, HttpServletRequest request) {
        servicoService.excluir(usuarioAtualResolver.resolver(request), id);
    }

    /** Usado pelo formulário de novo/editar agendamento para avisar o
     *  usuário de um conflito de horário antes de salvar. */
    @GetMapping("/conflito")
    public List<ServicoDTO> verificarConflito(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime hora,
            @RequestParam(required = false) Long excluirId,
            HttpServletRequest request) {
        return servicoService.verificarConflito(usuarioAtualResolver.resolver(request), data, hora, excluirId);
    }
}

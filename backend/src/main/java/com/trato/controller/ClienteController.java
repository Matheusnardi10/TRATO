package com.trato.controller;

import com.trato.config.UsuarioAtualResolver;
import com.trato.dto.ClienteDTO;
import com.trato.service.ClienteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;
    private final UsuarioAtualResolver usuarioAtualResolver;

    public ClienteController(ClienteService clienteService, UsuarioAtualResolver usuarioAtualResolver) {
        this.clienteService = clienteService;
        this.usuarioAtualResolver = usuarioAtualResolver;
    }

    @GetMapping
    public List<ClienteDTO> listar(HttpServletRequest request) {
        return clienteService.listar(usuarioAtualResolver.resolver(request));
    }

    @GetMapping("/{id}")
    public ClienteDTO buscar(@PathVariable Long id, HttpServletRequest request) {
        return clienteService.buscar(usuarioAtualResolver.resolver(request), id);
    }

    @PostMapping
    public ClienteDTO criar(@RequestBody ClienteDTO dados, HttpServletRequest request) {
        return clienteService.criar(usuarioAtualResolver.resolver(request), dados);
    }

    @PutMapping("/{id}")
    public ClienteDTO atualizar(@PathVariable Long id, @RequestBody ClienteDTO dados, HttpServletRequest request) {
        return clienteService.atualizar(usuarioAtualResolver.resolver(request), id, dados);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id, HttpServletRequest request) {
        clienteService.excluir(usuarioAtualResolver.resolver(request), id);
    }
}

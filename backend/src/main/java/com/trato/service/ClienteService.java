package com.trato.service;

import com.trato.dto.ClienteDTO;
import com.trato.entity.Cliente;
import com.trato.repository.ClienteRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<ClienteDTO> listar(Long usuarioId) {
        return clienteRepository.findByUsuarioId(usuarioId).stream().map(this::paraDTO).toList();
    }

    public ClienteDTO buscar(Long usuarioId, Long id) {
        return paraDTO(buscarEntidade(usuarioId, id));
    }

    public Cliente buscarEntidade(Long usuarioId, Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado."));
        if (!cliente.getUsuarioId().equals(usuarioId)) {
            throw new EntityNotFoundException("Cliente não encontrado.");
        }
        return cliente;
    }

    public ClienteDTO criar(Long usuarioId, ClienteDTO dados) {
        Cliente cliente = new Cliente();
        cliente.setUsuarioId(usuarioId);
        aplicar(cliente, dados);
        return paraDTO(clienteRepository.save(cliente));
    }

    public ClienteDTO atualizar(Long usuarioId, Long id, ClienteDTO dados) {
        Cliente cliente = buscarEntidade(usuarioId, id);
        aplicar(cliente, dados);
        return paraDTO(clienteRepository.save(cliente));
    }

    public void excluir(Long usuarioId, Long id) {
        Cliente cliente = buscarEntidade(usuarioId, id);
        clienteRepository.delete(cliente);
    }

    private void aplicar(Cliente cliente, ClienteDTO dados) {
        cliente.setNome(dados.getNome());
        cliente.setTelefone(dados.getTelefone());
        cliente.setEmail(dados.getEmail());
        cliente.setDocumento(dados.getDocumento());
        cliente.setEndereco(dados.getEndereco());
        cliente.setObservacoes(dados.getObservacoes());
        cliente.setStatus(dados.getStatus() == null ? "ativo" : dados.getStatus());
    }

    public ClienteDTO paraDTO(Cliente c) {
        return new ClienteDTO(c.getId(), c.getNome(), c.getTelefone(), c.getEmail(), c.getDocumento(),
                c.getEndereco(), c.getObservacoes(), c.getStatus(), c.getCriadoEm());
    }
}

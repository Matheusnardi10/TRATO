package com.trato.repository;

import com.trato.entity.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    Optional<Pagamento> findByServicoId(Long servicoId);
    List<Pagamento> findByClienteId(Long clienteId);

    @org.springframework.data.jpa.repository.Query(
        "select p from Pagamento p where p.servico.usuarioId = :usuarioId"
    )
    List<Pagamento> findByUsuarioId(Long usuarioId);
}

package com.trato.repository;

import com.trato.entity.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findByUsuarioId(Long usuarioId);
    List<Contrato> findByUsuarioIdAndStatus(Long usuarioId, String status);
    Optional<Contrato> findByOrcamentoId(Long orcamentoId);
    Optional<Contrato> findByTokenAceite(String tokenAceite);
    long countByUsuarioId(Long usuarioId);
}

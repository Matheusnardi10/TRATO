package com.trato.repository;

import com.trato.entity.Orcamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {
    List<Orcamento> findByUsuarioId(Long usuarioId);
    List<Orcamento> findByUsuarioIdAndStatus(Long usuarioId, String status);
    long countByUsuarioId(Long usuarioId);
}

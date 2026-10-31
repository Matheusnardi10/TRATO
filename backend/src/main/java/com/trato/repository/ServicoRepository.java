package com.trato.repository;

import com.trato.entity.Servico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ServicoRepository extends JpaRepository<Servico, Long> {
    List<Servico> findByUsuarioId(Long usuarioId);
    List<Servico> findByUsuarioIdAndStatus(Long usuarioId, String status);
    List<Servico> findByUsuarioIdAndDataBetween(Long usuarioId, LocalDate inicio, LocalDate fim);
    long countByUsuarioId(Long usuarioId);
}

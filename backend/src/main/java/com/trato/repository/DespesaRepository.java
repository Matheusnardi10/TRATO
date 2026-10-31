package com.trato.repository;

import com.trato.entity.Despesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DespesaRepository extends JpaRepository<Despesa, Long> {
    List<Despesa> findByServicoId(Long servicoId);

    @Query("select d from Despesa d where d.servico.usuarioId = :usuarioId")
    List<Despesa> findByUsuarioId(Long usuarioId);
}

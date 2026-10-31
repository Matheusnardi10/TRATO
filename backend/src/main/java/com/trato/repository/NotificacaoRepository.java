package com.trato.repository;

import com.trato.entity.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {
    List<Notificacao> findByUsuarioIdOrderByDataDesc(Long usuarioId);
    List<Notificacao> findByUsuarioIdAndLidaFalse(Long usuarioId);
    boolean existsByChave(String chave);
}

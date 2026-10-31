package com.trato.config;

import com.trato.entity.Usuario;
import com.trato.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Resolve qual usuário está "logado" na requisição atual.
 *
 * Login aqui é propositalmente simples (sem JWT/Spring Security completo,
 * como pedido): o frontend manda o id do usuário autenticado no header
 * "X-Usuario-Id" (ver core/interceptors/auth.interceptor.ts). Isso NÃO é
 * autenticação segura para produção — é o nível combinado para este
 * projeto de estudo. Se o header não vier (ex.: chamando a API direto com
 * curl para testar), cai no usuário de demonstração seedado na inicialização.
 */
@Component
public class UsuarioAtualResolver {

    private final UsuarioRepository usuarioRepository;

    public UsuarioAtualResolver(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Long resolver(HttpServletRequest request) {
        String header = request.getHeader("X-Usuario-Id");
        if (header != null && !header.isBlank()) {
            try {
                Long id = Long.parseLong(header);
                if (usuarioRepository.existsById(id)) return id;
            } catch (NumberFormatException ignored) {
                // cai para o fallback abaixo
            }
        }
        return usuarioRepository.findByEmailIgnoreCase("demo@trato.app")
                .map(Usuario::getId)
                .orElseGet(() -> usuarioRepository.findAll().stream()
                        .findFirst().map(Usuario::getId).orElse(null));
    }
}

package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTOs do módulo de autenticação — um arquivo só, por serem pequenos e
 *  sempre usados juntos (mesma ideia do LoginResponse do frontend). */
public class AuthDtos {

    @Data
    @NoArgsConstructor
    public static class LoginRequest {
        private String email;
        private String senha;
    }

    @Data
    @NoArgsConstructor
    public static class CadastroRequest {
        private String nome;
        private String nomeProfissional;
        private String email;
        private String telefone;
        private String senha;
    }

    @Data
    @NoArgsConstructor
    public static class NegocioDTO {
        private String cidade;
        private String logo;
        private String telefoneProfissional;
        private String emailProfissional;
        private String pix;
        private String formaPagamentoPadrao;
        private String prazoPadrao;
        private String documento;
        private String endereco;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UsuarioDTO {
        private Long id;
        private String nome;
        private String nomeProfissional;
        private String email;
        private String telefone;
        private String nicho;
        private NegocioDTO negocio;
    }

    @Data
    @NoArgsConstructor
    public static class SenhaRequest {
        private String senhaAtual;
        private String novaSenha;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LoginResponse {
        private boolean ok;
        private UsuarioDTO usuario;
        private String erro;

        public static LoginResponse sucesso(UsuarioDTO usuario) {
            return new LoginResponse(true, usuario, null);
        }

        public static LoginResponse falha(String erro) {
            return new LoginResponse(false, null, erro);
        }
    }
}

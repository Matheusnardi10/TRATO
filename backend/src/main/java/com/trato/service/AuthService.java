package com.trato.service;

import com.trato.dto.AuthDtos.CadastroRequest;
import com.trato.dto.AuthDtos.LoginResponse;
import com.trato.dto.AuthDtos.NegocioDTO;
import com.trato.dto.AuthDtos.UsuarioDTO;
import com.trato.entity.Negocio;
import com.trato.entity.Usuario;
import com.trato.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public LoginResponse entrar(String email, String senha) {
        return usuarioRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .map(usuario -> {
                    if (!encoder.matches(senha == null ? "" : senha, usuario.getSenhaHash())) {
                        return LoginResponse.falha("Senha incorreta. Tente novamente.");
                    }
                    return LoginResponse.sucesso(paraDTO(usuario));
                })
                .orElseGet(() -> LoginResponse.falha("Não encontramos uma conta com esse e-mail."));
    }

    public LoginResponse cadastrar(CadastroRequest dados) {
        if (dados.getEmail() == null || dados.getEmail().isBlank()) {
            return LoginResponse.falha("Informe um e-mail.");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(dados.getEmail().trim())) {
            return LoginResponse.falha("Este e-mail já está cadastrado.");
        }
        Usuario usuario = new Usuario();
        usuario.setNome(dados.getNome());
        usuario.setNomeProfissional(
                dados.getNomeProfissional() == null || dados.getNomeProfissional().isBlank()
                        ? dados.getNome() : dados.getNomeProfissional());
        usuario.setEmail(dados.getEmail().trim());
        usuario.setTelefone(dados.getTelefone());
        usuario.setSenhaHash(encoder.encode(dados.getSenha() == null ? "" : dados.getSenha()));
        usuarioRepository.save(usuario);
        return LoginResponse.sucesso(paraDTO(usuario));
    }

    public UsuarioDTO atualizar(Long id, String nicho) {
        Usuario usuario = usuarioRepository.findById(id).orElseThrow();
        usuario.setNicho(nicho);
        usuarioRepository.save(usuario);
        return paraDTO(usuario);
    }

    /** Tela de Configurações → aba Perfil (nome, nome profissional, telefone). */
    public UsuarioDTO atualizarPerfil(Long id, String nome, String nomeProfissional, String telefone) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        if (nome != null && !nome.isBlank()) usuario.setNome(nome);
        if (nomeProfissional != null) usuario.setNomeProfissional(nomeProfissional);
        if (telefone != null) usuario.setTelefone(telefone);
        usuarioRepository.save(usuario);
        return paraDTO(usuario);
    }

    /** Tela de Configurações → aba Negócio (cidade, logo, pix, forma de pagamento padrão, etc). */
    public UsuarioDTO atualizarNegocio(Long id, NegocioDTO dados) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        Negocio negocio = usuario.getNegocio();
        if (negocio == null) negocio = new Negocio();
        if (dados.getCidade() != null) negocio.setCidade(dados.getCidade());
        if (dados.getLogo() != null) negocio.setLogo(dados.getLogo());
        if (dados.getTelefoneProfissional() != null) negocio.setTelefoneProfissional(dados.getTelefoneProfissional());
        if (dados.getEmailProfissional() != null) negocio.setEmailProfissional(dados.getEmailProfissional());
        if (dados.getPix() != null) negocio.setPix(dados.getPix());
        if (dados.getFormaPagamentoPadrao() != null) negocio.setFormaPagamentoPadrao(dados.getFormaPagamentoPadrao());
        if (dados.getPrazoPadrao() != null) negocio.setPrazoPadrao(dados.getPrazoPadrao());
        if (dados.getDocumento() != null) negocio.setDocumento(dados.getDocumento());
        if (dados.getEndereco() != null) negocio.setEndereco(dados.getEndereco());
        usuario.setNegocio(negocio);
        usuarioRepository.save(usuario);
        return paraDTO(usuario);
    }

    /** Tela de Configurações → alterar senha. Exige a senha atual correta. */
    public LoginResponse alterarSenha(Long id, String senhaAtual, String novaSenha) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        if (!encoder.matches(senhaAtual == null ? "" : senhaAtual, usuario.getSenhaHash())) {
            return LoginResponse.falha("Senha atual incorreta.");
        }
        if (novaSenha == null || novaSenha.isBlank()) {
            return LoginResponse.falha("Informe a nova senha.");
        }
        usuario.setSenhaHash(encoder.encode(novaSenha));
        usuarioRepository.save(usuario);
        return LoginResponse.sucesso(paraDTO(usuario));
    }

    public UsuarioDTO paraDTO(Usuario u) {
        NegocioDTO negocioDTO = new NegocioDTO();
        Negocio n = u.getNegocio();
        if (n != null) {
            negocioDTO.setCidade(n.getCidade());
            negocioDTO.setLogo(n.getLogo());
            negocioDTO.setTelefoneProfissional(n.getTelefoneProfissional());
            negocioDTO.setEmailProfissional(n.getEmailProfissional());
            negocioDTO.setPix(n.getPix());
            negocioDTO.setFormaPagamentoPadrao(n.getFormaPagamentoPadrao());
            negocioDTO.setPrazoPadrao(n.getPrazoPadrao());
            negocioDTO.setDocumento(n.getDocumento());
            negocioDTO.setEndereco(n.getEndereco());
        }
        return new UsuarioDTO(u.getId(), u.getNome(), u.getNomeProfissional(), u.getEmail(), u.getTelefone(), u.getNicho(), negocioDTO);
    }
}

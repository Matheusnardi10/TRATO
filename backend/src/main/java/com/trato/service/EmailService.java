package com.trato.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import static org.springframework.web.util.HtmlUtils.htmlEscape;

/**
 * Envia o e-mail com o link de aprovação do contrato.
 *
 * Se o SMTP não estiver configurado (MAIL_HOST vazio, ver
 * application.properties), não envia nada: só registra o link no log e
 * devolve false — assim o fluxo continua testável localmente pelo botão
 * "Copiar link" da tela do contrato.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String host;
    private final String senha;
    private final String remetente;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${spring.mail.host:}") String host,
                        @Value("${spring.mail.password:}") String senha,
                        @Value("${trato.email.remetente:}") String remetente) {
        this.mailSender = mailSender;
        this.host = host;
        this.senha = senha;
        this.remetente = remetente;
    }

    /** Só envia com host e senha definidos — sem MAIL_PASSWORD cai no modo "Copiar link". */
    public boolean configurado() {
        return StringUtils.hasText(host) && StringUtils.hasText(senha) && mailSender.getIfAvailable() != null;
    }

    /** @return true se o e-mail saiu; false se o SMTP não está configurado. */
    public boolean enviarContratoParaAprovacao(String para, String clienteNome, String profissionalNome,
                                                String tituloContrato, String numero, String link) {
        if (!configurado()) {
            log.warn("SMTP não configurado — e-mail para {} NÃO enviado. Link de aprovação do contrato #{}: {}", para, numero, link);
            return false;
        }
        String assunto = "Contrato #" + numero + " para sua aprovação — " + profissionalNome;
        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2933">
                  <p>Olá, %s!</p>
                  <p><strong>%s</strong> enviou o contrato <strong>%s</strong> (#%s) para você revisar e aprovar.</p>
                  <p style="margin:28px 0">
                    <a href="%s" style="background:#12564E;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                      Ver e aprovar o contrato
                    </a>
                  </p>
                  <p style="font-size:13px;color:#52606d">Se o botão não funcionar, copie e cole este endereço no navegador:<br>%s</p>
                  <p style="font-size:13px;color:#52606d">Se tiver alguma dúvida sobre o contrato, responda diretamente ao profissional antes de aprovar.</p>
                </div>
                """.formatted(htmlEscape(clienteNome), htmlEscape(profissionalNome), htmlEscape(tituloContrato),
                htmlEscape(numero), htmlEscape(link), htmlEscape(link));
        try {
            JavaMailSender sender = mailSender.getObject();
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, "UTF-8");
            if (StringUtils.hasText(remetente)) helper.setFrom(remetente);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(html, true);
            sender.send(msg);
            return true;
        } catch (MailAuthenticationException e) {
            log.error("Gmail recusou o login do SMTP ao enviar o contrato #{}", numero, e);
            throw new IllegalArgumentException("O Gmail recusou o login da conta de envio. Confira a senha de app em MAIL_PASSWORD "
                    + "(16 letras, sem espaços, gerada na conta sistematrato@gmail.com).");
        } catch (MessagingException | MailException e) {
            log.error("Falha ao enviar e-mail do contrato #{} para {}", numero, para, e);
            throw new IllegalArgumentException("Não foi possível enviar o e-mail para " + para + ". Confira o endereço e a configuração de SMTP.");
        }
    }
}

package com.trato.dto;

import com.trato.dto.ContratoDTO.AditivoDTO;
import com.trato.dto.ContratoDTO.ClausulaDTO;

import java.time.LocalDateTime;
import java.util.List;

/** O que o cliente vê na página pública de aprovação — só o texto do
 *  contrato, sem dados internos (custos, campos do formulário, ids). */
public record ContratoPublicoDTO(
        String numero,
        String titulo,
        String tituloDocumento,
        String profissionalNome,
        String clienteNome,
        double valorTotal,
        String status,
        String cabecalho,
        List<ClausulaDTO> clausulas,
        List<AditivoDTO> aditivos,
        String assinatura,
        String avisoLegal,
        String versaoModelos,
        LocalDateTime aprovadoEm
) {}

# Certificados adicionais

O host `download.inep.gov.br` não envia a CA intermediária de seu certificado. O arquivo
`rnp-icpedu-gr46-ov-tls-ca-2025.pem` completa essa cadeia sem desativar a validação TLS.

- origem declarada no AIA do certificado do host:
  `http://secure.globalsign.com/cacert/rnpicpedugr46ovtlsca2025.crt`;
- emissor: `GlobalSign Root R46`;
- validade: 19/11/2025 a 19/11/2030;
- SHA-256: `E1:07:47:D4:DA:7B:AB:09:CB:A9:95:2F:01:9D:35:34:CB:9F:BA:07:0B:F1:3D:87:91:B1:69:9C:D2:FF:59:DD`.

Em 29/08/2026, `openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt` confirmou a assinatura
contra as raízes do sistema. A aquisição deve falhar fechada quando o certificado expirar ou a
cadeia mudar; não existe opção de transporte inseguro no script.

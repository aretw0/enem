# Aquisições oficiais

Os manifestos deste diretório descrevem o que baixar; os recibos provam o que foi capturado. Os
PDFs ficam em `.local/acquisitions/`, fora do Git, e podem ser reconstruídos pela URL e conferidos
pelo SHA-256 do recibo.

Para capturar a coleção azul da aplicação regular de 2025:

```bash
pnpm run acquire:enem -- --manifest data/acquisitions/enem-2025-regular-national-blue.json
```

Use `--artifact <id>` para apenas um arquivo. Um recibo existente só é substituído com `--force`.
O transporte aceita apenas HTTPS e os hosts do manifesto. A CA adicional apenas completa a cadeia
incompleta do host do Inep; o script não oferece opção para desabilitar TLS.

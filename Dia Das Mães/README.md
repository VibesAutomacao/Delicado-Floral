# Delicado Floral — Página de venda (Dia das Mães)

Site simples e responsivo para vender um único produto via PIX.

Arquivos:
- `index.html` — página principal do produto.
- `pix.html` — página que abre em nova aba com QR code e chave PIX.
- `styles.css` — estilos.
- `script.js` — scripts para copiar chave/valor e comportamento simples.
- `assets/` — imagens SVG placeholders (logo PIX, QR e produto).

Personalização:
- Substitua `assets/qr-placeholder.svg` pelo QR code real.
- Atualize o valor e a chave PIX em `pix.html` e `index.html`.

Abrir localmente: basta abrir `index.html` no navegador.

Segurança e proteção do acesso
--------------------------------
Estas opções ajudam a reduzir acesso público e rastreamento. Atenção: a proteção via JavaScript (senha em `localStorage`) é apenas um impedimento leve — não deve ser usada para segredos críticos.

- Definir senha simples (local): abra o console do navegador e cole:

```js
localStorage.setItem('delicado_pwd','SUA-SENHA-AQUI')
```

Depois, ao abrir `pix.html`, insira essa senha para desbloquear o QR.

- Bloqueio no servidor (recomendado, mais seguro):

1) Apache (.htaccess) — exige que o servidor Apache permita overrides:

```
AuthType Basic
AuthName "Área restrita"
AuthUserFile /caminho/para/.htpasswd
Require valid-user
```

Crie o arquivo `.htpasswd` com uma conta (use `htpasswd` do Apache ou geradores online).

2) Nginx — exemplo de bloqueio por senha HTTP Basic:

```
location / {
	auth_basic "Área restrita";
	auth_basic_user_file /etc/nginx/.htpasswd;
}
```

3) Evitar envio de referrer e indexação (já aplicado em `pix.html`):

```html
<meta name="robots" content="noindex,nofollow" />
<meta name="referrer" content="no-referrer" />
```

Limitações e recomendações
- A proteção por `localStorage` é local ao navegador e pode ser lida/alterada no console. Use bloqueio por servidor para segurança real.
- Não compartilhe chaves/QR em repositórios públicos. Remova histórico git se já expôs (ou use `git filter-branch` / `git filter-repo`).
- Para evitar rastreamento, além da meta `referrer`, use headers `Referrer-Policy: no-referrer` e `X-Robots-Tag: noindex` no servidor.

Se quiser, eu posso gerar o arquivo `.htpasswd` para você (me diga o usuário e a senha) ou montar a configuração Nginx pronta para copiar para seu servidor.

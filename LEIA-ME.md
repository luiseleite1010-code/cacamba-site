# CaçambaFácil — Deploy no Vercel (Grátis)

## Estrutura do projeto
```
cacamba-site/
├── public/
│   └── index.html       ← seu site completo
├── api/
│   └── pix.js           ← API de pagamento (Node.js)
├── vercel.json          ← configuração do Vercel
└── package.json
```

---

## Passo a passo para publicar

### 1. Criar conta no Vercel
Acesse https://vercel.com e clique em **Sign Up**.
Crie a conta com o **GitHub** (recomendado — é mais fácil).

### 2. Instalar o GitHub Desktop (se não tiver)
Baixe em https://desktop.github.com
Faça login com sua conta GitHub.

### 3. Criar repositório no GitHub
1. Abra o GitHub Desktop
2. Clique em **File → New Repository**
3. Nome: `cacamba-site`
4. Clique em **Create Repository**
5. Clique em **Show in Explorer** e copie os arquivos desta pasta para lá
6. De volta no GitHub Desktop, escreva "primeiro commit" e clique **Commit to main**
7. Clique em **Publish repository** (deixe como público)

### 4. Conectar ao Vercel
1. Acesse https://vercel.com/new
2. Clique em **Import Git Repository**
3. Selecione o repositório `cacamba-site`
4. Clique em **Deploy** — pronto!

### 5. Seu site estará online em:
```
https://cacamba-site.vercel.app
```
Você pode adicionar um domínio próprio depois (ex: cacambafacil.com.br) nas configurações do Vercel.

---

## Como atualizar o site depois
1. Edite os arquivos na pasta local
2. No GitHub Desktop: escreva uma mensagem e clique **Commit**
3. Clique **Push origin**
4. O Vercel atualiza automaticamente em ~30 segundos ✅

---

## Variável de ambiente (opcional — mais seguro)
Para não deixar a SK exposta no código, você pode:
1. No painel do Vercel → **Settings → Environment Variables**
2. Adicionar: `MEDUSAPAY_SK` = `sk_live_v2IaJ7Pl5FQqItCibd4tuBbc2d6x6PY9jENJ5nDwxe`
3. No arquivo `api/pix.js`, trocar a linha da SK por:
   ```js
   const SK = process.env.MEDUSAPAY_SK;
   ```

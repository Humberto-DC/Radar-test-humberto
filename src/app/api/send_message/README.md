# Variáveis Aceitas nos Templates WhatsApp

Este documento descreve todas as variáveis disponíveis no sistema de envio de mensagens via WhatsApp (360dialog) e como utilizá-las corretamente em um template.

As variáveis são substituídas automaticamente pelos dados do cliente e do vendedor no momento do envio, funcionando tanto no:

🧪 SANDBOX (modo texto)

🚀 MODO REAL (template aprovado pela Meta)

### 1. Como escrever variáveis no template

Todas as variáveis devem ser escritas usando a sintaxe:

{{nome_da_variavel}}


Exemplo:

Olá {{nome}}, tudo bem? Seu limite atual é {{limite}}.


✔ Deve ter duas chaves
✔ Não usar %, $, <<>> ou outros formatos
✔ Apenas letras minúsculas sem acentos no nome das variáveis

### 2. Lista de variáveis disponíveis
👤 Dados do Cliente
Variável	Descrição	Exemplo
{{nome}}	Primeiro nome do contato ou do cliente	“Marcos”
{{cliente}}	Primeira palavra do nome cadastrado do cliente	“Supermercado Silva” → “Supermercado”
{{cidade}}	Cidade com primeira letra maiúscula	“brasília” → “Brasília”
{{limite}}	Limite de crédito	“15000”
{{ultima_compra}}	Data da última compra	“2025-01-12”
🧑‍💼 Dados do Vendedor
Variável	Descrição
{{vendedor}}	Primeiro nome do vendedor responsável

Exemplo:
“JOÃO CARLOS PEREIRA” → João
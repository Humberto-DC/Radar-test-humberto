# 📌 Projeto Interno — Painel de Clientes e Mensagens

Este é um projeto **privado** desenvolvido com **Next.js + Supabase**, utilizado para gestão de clientes, contatos, mensagens e envios automáticos.

Este README foi criado para orientar **futuros desenvolvedores** que venham a trabalhar no projeto.

---

## 🚀 Tecnologias Utilizadas

- **Next.js (App Router)**
- **React**
- **TypeScript**
- **TailwindCSS**
- **Supabase** (PostgreSQL)
- **date-fns** para manipulação de datas

---

### Responsabilidades

- **app/** — páginas e rotas (App Router)
- **components/** — UI reutilizável (Filtros, tabelas, cards, histórico, mensagens)
- **lib/** — serviços (ex.: client do Supabase)
- **types/** — tipagens da aplicação
- **utils/** — funções auxiliares (regex, formatação, datas, helpers)

---

## 🗄 Banco de Dados (Supabase)

O projeto utiliza Postgres com as tabelas principais:

### **clientes**
Armazena informações da empresa.

Campos importantes:
- `id_cliente`
- `Cliente`
- `Limite`
- `data_ultima_compra`
- `ultima_interacao`
- `id_vendedor`

---

### **contatos_cliente**
Um cliente pode ter vários contatos.

- `id_contato`
- `id_cliente` (FK → clientes)
- `nome_contato`
- `telefone`
- `funcao`
- `principal` (boolean)

---

### **vendedores**
Lista de vendedores internos.

- `id`
- `nome_vendedor`

---

### **mensagens**
Mensagens enviáveis via painel.

- `id_mensagem`
- `titulo`
- `categoria`
- `texto`
- `status` (ex: "approved", "pending", "rejected")

---

### **envios**
Histórico de mensagens enviadas.

- `id`
- `id_contato` (FK → contatos_cliente)
- `id_mensagem` (FK → mensagens)
- `status_entrega`
- `data_envio`

---

#como rodar o projeto

###instalar depenências
- npm isntall

###Rodar aplicação 
- npm run dev

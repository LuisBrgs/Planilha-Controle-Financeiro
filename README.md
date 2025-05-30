# Planilha de Controle Financeiro Automatizado

Esta planilha foi desenvolvida para organizar e categorizar automaticamente transações financeiras a partir de extratos bancários recebidos por e-mail. Ela centraliza os dados na aba **Lançamentos**, categoriza os gastos e receitas, define o tipo de transação e apresenta análises visuais na aba **Dashboard**.

---

## Funcionalidades Principais

### ✉️ Processamento de Extratos Bancários (por e-mail)

* Lê e-mails não lidos com anexo `.CSV` contendo no assunto: `NuBank`, `Inter` ou `PicPay`.
* Extrai os dados de cada extrato e os insere na aba **Lançamentos**.
* Marca os e-mails como lidos após o processamento.

### ✅ Lógica de Preenchimento Automático

#### Colunas na aba **Lançamentos**:

1. **Data**: data da transação (detectada a partir da coluna com nome semelhante a "data" no CSV).
2. **Descrição**: concatena todas as colunas de texto não numéricas do CSV para criar uma descrição mais completa.
3. **Categoria**: atribuída automaticamente com base em palavras-chave na descrição.
4. **Tipo**:

   * `Receita` se a categoria for "Férias", "Auxílio" ou "Outras receitas".
   * `Despesa fixa` se a descrição contiver um termo listado na aba **Configurações!A4\:A**.
   * `Ignorar` se a categoria for "Salário" ou "Não definido".
   * `Despesa Variável` em qualquer outro caso.
5. **Valor**: interpretado como valor absoluto, corrigindo o formato brasileiro (ex.: `4.044,30` → `4044.30`).
6. **Banco**: origem do extrato (extraído do assunto do e-mail).

#### Categoria Automática (baseada em palavras-chave)

* Exemplo: se a descrição contiver "supermercado" ou "ifood", a categoria será "Alimentação".
* A detecção considera palavras com ou sem acento (ex.: "salario" = "Salário").

---

## 📄 Aba **Configurações**

* **H2\:H**: lista de categorias personalizadas que podem ser reconhecidas.
* **A4\:A**: lista de descrições que devem ser tratadas como `Despesas fixas`.

---

## 📊 Aba **Dashboard**

Apresenta gráficos e resumos financeiros baseados na aba **Lançamentos**:

* **Resumo por tipo**: totais de Receita, Despesa fixa, Despesa variável e valores Ignorados.
* **Gráfico de Pizza**: distribuição das despesas por categoria.
* **Gráfico de Colunas por Mês**: evolução mensal das receitas e despesas.
* **Saldo Mensal**: receita - despesas agrupadas por mês.

Os dados do Dashboard são atualizados automaticamente com base nos lançamentos inseridos.

---

## ⚙️ Como Usar

1. Dê permissões ao script no Google Sheets (primeira execução).
2. Clique no menu **Automacao Financeira** > **Processar Extratos**.
3. Verifique a aba **Lançamentos** para os dados importados e categorizados.
4. Confira os resumos e análises na aba **Dashboard**.

---

## ⚠️ Observações Importantes

* Os arquivos CSV devem conter colunas com nomes similares a `data`, `valor`, `descrição`, `categoria`.
* A categorização é aproximada e baseada em palavras-chave, podendo ser ajustada conforme necessidade.
* Transações com valores negativos são tratadas como despesas e positivos como receitas.
* Transações com categoria "Salário" são ignoradas para evitar dupla contagem.

---

## 📍 Personalização

* Adicione/edite as palavras-chave no script `palavrasChave` para ajustar a categorização.
* Atualize as listas da aba **Configurações** para refletir suas despesas fixas e categorias personalizadas.

---

Feito com ❤️ para facilitar seu controle financeiro!

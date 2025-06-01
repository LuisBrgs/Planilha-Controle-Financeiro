function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Automacao Financeira')
    .addItem('Processar Extratos', 'processarExtratos')
    .addToUi();
}

function processarExtratos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaLancamentos = obterOuCriarAba(ss, "Lançamentos");
  var categorias = obterCategorias(ss);
  var despesasFixas = obterDespesasFixas(ss);

  var threads = GmailApp.search('is:unread subject:(NuBank OR Inter OR PicPay) has:attachment');

  threads.forEach(function(thread) {
    var messages = thread.getMessages();

    messages.forEach(function(message) {
      var banco = message.getSubject();
      var attachments = message.getAttachments();

      attachments.forEach(function(file) {
        if (file.getContentType().includes('csv') || file.getName().endsWith('.csv')) {
          var rawData = file.getDataAsString();
          var separador = rawData.indexOf(';') > -1 ? ';' : ',';

          try {
            var csv = Utilities.parseCsv(rawData, separador);
          } catch (e) {
            Logger.log("Erro ao processar CSV: " + e);
            return;
          }

          var headerIndex = -1;
          for (var i = 0; i < csv.length; i++) {
            if (csv[i][0] && csv[i][0].toLowerCase().includes("data")) {
              headerIndex = i;
              break;
            }
          }
          if (headerIndex === -1) return;

          var headers = csv[headerIndex].map(h => h.trim().toLowerCase());

          for (var j = headerIndex + 1; j < csv.length; j++) {
            var row = csv[j];
            if (!row[0]) continue;

            var data = "";
            var valor = 0;
            var descricoes = [];

            for (var k = 0; k < row.length; k++) {
              var valorCelula = row[k] ? row[k].toString().trim() : "";
              if (headers[k].includes("data")) {
                data = valorCelula;
              } else if (headers[k].includes("valor")) {
                var valorTexto = valorCelula.replace(/\./g, '').replace(/R?\$?\s*/g, '').replace(',', '.');
                var valorBruto = parseFloat(valorTexto);
                if (isNaN(valorBruto)) valorBruto = 0;
                valor = Math.abs(valorBruto);
              } else {
                if (isNaN(valorCelula.replace(',', '.'))) {
                  descricoes.push(valorCelula);
                }
              }
            }

            var descricaoCompleta = descricoes.join(" - ");
            var categoria = categorizar(descricaoCompleta, categorias);
            var tipo = determinarTipo(categoria, descricaoCompleta, despesasFixas);

            var ultimaLinha = abaLancamentos.getLastRow();
            var proximaLinha = ultimaLinha + 1;

            abaLancamentos.getRange(proximaLinha, 1, 1, 6)
              .setValues([[data, descricaoCompleta, categoria, tipo, valor, banco]]);
          }
        }
      });
    });
    thread.markRead();
  });

  Logger.log("Processamento concluido com e-mails marcados como lidos.");
}

function obterOuCriarAba(ss, nomeAba) {
  var aba = ss.getSheetByName(nomeAba);
  if (!aba) {
    aba = ss.insertSheet(nomeAba);
  }
  return aba;
}

function obterCategorias(ss) {
  var abaConfig = ss.getSheetByName("Configurações");
  if (!abaConfig) return [];
  var valores = abaConfig.getRange("H2:H" + abaConfig.getLastRow()).getValues();
  return valores.flat().filter(function(c){ return c; });
}

function obterDespesasFixas(ss) {
  var abaConfig = ss.getSheetByName("Configurações");
  if (!abaConfig) return [];
  var valores = abaConfig.getRange("A4:A" + abaConfig.getLastRow()).getValues();
  return valores.flat().filter(function(c){ return c; });
}

function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function categorizar(descricao, categorias) {
  var descricaoNormalizada = normalizarTexto(descricao);

  var palavrasChave = {
    "Alimentação": ["mercado", "restaurante", "padaria", "supermercado", "ifood", "panificadora"],
    "Assinaturas": ["netflix", "spotify", "prime", "youtube", "helpmaxcom"],
    "Auxílio": ["auxilio"],
    "Cuidados Pessoais": ["farmacia", "drogaria", "beleza", "cosmetico"],
    "Dívidas/Empréstimos": ["emprestimo", "parcelamento", "divida"],
    "Educação": ["faculdade", "curso", "ensino", "escola"],
    "Férias": ["hotel", "passagem", "viagem"],
    "Investimentos": ["tesouro", "acoes", "poupanca", "investimento"],
    "Lazer": ["cinema", "bar", "show", "evento"],
    "Moradia": ["aluguel", "condominio", "luz", "agua", "energia"],
    "Outras receitas": ["deposito", "pix recebido"],
    "Outros gastos": ["taxa", "tarifa", "outros", "shopping", "pix enviado"],
    "Presentes/Doações": ["presente", "doacao"],
    "Salário": ["salario", "pro labore"],
    "Saúde": ["plano", "hospital", "exame"],
    "Transporte": ["uber", "combustivel", "gasolina", "onibus", "transporte", "posto"],
    "Vestuário": ["roupa", "calcado", "vestuario"]
  };

  for (var categoria in palavrasChave) {
    var chaves = palavrasChave[categoria];
    for (var i = 0; i < chaves.length; i++) {
      if (descricaoNormalizada.includes(chaves[i])) {
        return categoria;
      }
    }
  }

  return "Não definido";
}

function determinarTipo(categoria, descricao, despesasFixas) {
  var receitas = ["Salário", "Férias", "Auxílio", "Outras receitas"];
  if (categoria === "Salário") return "Ignorar";
  if (categoria === "Não definido") return "Ignorar";
  if (despesasFixas.some(df => normalizarTexto(descricao).includes(normalizarTexto(df)))) return "Despesa fixa";
  if (receitas.includes(categoria)) return "Receita";
  return "Despesa Variável";
}

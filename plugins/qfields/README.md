# Plugin `qfields` para CKEditor 4

O **qfields** é um plugin para o CKEditor 4 que permite a inserção de campos dinâmicos e variáveis para a criação de **questionários, templates e formulários interativos**.

Ele é composto por duas partes principais:
1. **Plugin do Editor (`plugin.js`)**: O widget e a caixa de diálogo visual no CKEditor para que o usuário insira e configure os campos.
2. **Renderizador de Respostas (`render_qfields.js`)**: O utilitário que transforma o HTML salvo pelo CKEditor em um formulário real, preenchível pelo usuário final, com validações, máscaras, desenho de assinatura em canvas e upload de imagens.

---

## 📁 Estrutura de Arquivos

```
plugins/qfields/
├── dialogs/
│   └── qfield.js               # Caixa de diálogo de inserção e edição do campo no CKEditor
├── icons/
│   └── qfield.png              # Ícone do botão na barra de ferramentas do CKEditor
├── src/                        # Código-fonte modular do renderizador
│   ├── core/
│   │   ├── registry.js         # Gerenciador e registro de tipos de campos (Registry Pattern)
│   │   └── renderer.js         # Orquestrador que percorre o HTML e substitui os widgets
│   ├── fields/                 # Módulos isolados por tipo de campo (arquitetura de componentes)
│   │   ├── checkbox.js         # Campo Caixa de Seleção com indicador visual estilizado ( X )
│   │   ├── radio.js            # Campo Botão de Opção (grupos ou único) com indicador ( X )
│   │   ├── select.js           # Campo Dropdown com parsing de opções (* para padrão)
│   │   ├── signature.js        # Campo Assinatura (canvas HiDPI a punho, upload e redimensionador)
│   │   ├── text.js             # Campo Texto com suporte a formatação de máscaras em tempo real
│   │   └── textarea.js         # Campo Área de Texto com dimensões e placeholders
│   └── index.js                # Ponto de entrada do renderizador e exportação da API pública
├── build.js                    # Compilador inteligente com minificação direta e detecção automática
├── plugin.js                   # Definição e registro do plugin e widget no CKEditor 4
├── render_qfields.js           # Arquivo ÚNICO compilado e MINIFICADO para produção (~18 KB)
└── README.md                   # Esta documentação
```

---

## 🚀 Como Usar o Renderizador

Inclua o script compilado na página em que deseja exibir o formulário de resposta preenchível:

```html
<script src="../plugins/qfields/render_qfields.js"></script>
```

### 1. Converter HTML do CKEditor em Formulário

```javascript
// Obtém o HTML salvo do editor
var htmlSalvo = editor.getData();

// Converte os widgets .qfield-widget em inputs HTML reais
var htmlFormulario = QFieldsRenderer.render(htmlSalvo, {
    textClass: 'meu-input-texto',      // Opcional: classe CSS para inputs de texto
    selectClass: 'meu-select',         // Opcional: classe CSS para selects
    textareaClass: 'minha-textarea'    // Opcional: classe CSS para textareas
});

// Insere no container da página
document.getElementById('formularioContainer').innerHTML = htmlFormulario;
```

### 2. Utilitário de Formatação de Máscaras

```javascript
// Exemplo de uso avulso da função de máscara:
var cpfFormatado = QFieldsRenderer.formatWithMask('12345678901', '999.999.999-99');
// Retorna: "123.456.789-01"

var telFormatado = QFieldsRenderer.formatWithMask('11987654321', '(99) 9999-9999');
// Ajusta dinamicamente para celular: "(11) 98765-4321"
```

---

## ⚙️ Como Funciona a Compilação (`build.js`)

O projeto utiliza um sistema de compilação com **Zero-Configuration**. Você só precisa ter o **Node.js** instalado na máquina.

### Comandos Disponíveis:

Na raiz do projeto ou dentro de `plugins/qfields/`:

```powershell
# Compilação e minificação pontual:
node plugins/qfields/build.js

# Modo observador (recompila automaticamente a cada arquivo alterado em src/):
node plugins/qfields/build.js --watch
```

### O que o `build.js` faz nos bastidores:
1. **Varredura Dinâmica:** Lê a pasta `src/core/` e varre dinamicamente todos os arquivos em `src/fields/`.
2. **Empacotamento em Memória:** Concatena os módulos em ordem de dependência sem poluir o disco.
3. **Minificação com Terser:** Envia o código em memória diretamente para o Terser via stream (`stdin`), encurtando variáveis e removendo espaços.
4. **Arquivo Único:** Salva o resultado diretamente em `render_qfields.js` com uma taxa de compressão média de **~56%** (de 42 KB para 18 KB).

---

## 🧩 Como Criar um Novo Tipo de Campo (*Plug & Play*)

Graças à descoberta automática de campos, para adicionar um novo campo você **não precisa alterar nem o `build.js` nem o `index.js`**!

Basta criar um novo arquivo dentro de `src/fields/` seguindo a convenção abaixo:

### Exemplo: `src/fields/datepicker.js`

```javascript
/**
 * Campo de Data (Datepicker)
 */
var DatepickerField = (function () {
    'use strict';

    // CSS específico deste campo (opcional - injetado automaticamente)
    var styles = '.qform-datepicker { border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; }';

    function render(campo, options) {
        var name = campo.getAttribute('data-qfield-name') || 'campo_data';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';

        var input = document.createElement('input');
        input.type = 'date';
        input.name = name;
        input.className = 'qform-datepicker';
        if (isRequired) input.required = true;

        return input;
    }

    function init() {
        // Inicialização de escutas de eventos (opcional)
    }

    return {
        type: 'datepicker', // Valor correspondente ao data-qfield-type
        styles: styles,
        render: render,
        init: init
    };
})();

// Auto-registro no FieldRegistry
if (typeof FieldRegistry !== 'undefined') {
    FieldRegistry.register(DatepickerField);
}

// Suporte para testes em Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatepickerField;
}
```

Após salvar o arquivo, execute `node plugins/qfields/build.js` (ou deixe o `--watch` ligado):
- O script detectará o novo campo `datepicker` automaticamente.
- O campo será compilado, minificado e ficará pronto para uso imediato no `QFieldsRenderer.render(...)`!

---

## 📋 Campos Padrão e Atributos Suportados

| Tipo (`data-qfield-type`) | Descrição | Principais Atributos |
| :--- | :--- | :--- |
| `text` | Campo de entrada de texto de linha única | `name`, `width`, `height`, `required`, `placeholder`, `mask` |
| `textarea` | Área de texto multilinha expansível | `name`, `width`, `height`, `required`, `placeholder` |
| `select` | Caixa de seleção suspensa (dropdown) | `name`, `label`, `options` (separadas por vírgula, `*` marca a padrão), `default`, `required` |
| `checkbox` | Caixa de marcação única estilizada | `name`, `label`, `default` (`true`/`false`), `required` |
| `radio` | Botão de opção única | `name`, `label`, `options` (separadas por vírgula), `default`, `required` |
| `signature` | Assinatura digital (canvas a punho ou upload) | `name`, `label`, `width`, `height`, `sigmode` (`draw` ou `upload`), `required` |

---

## 📝 Licença
Desenvolvido como extensão para o CKEditor 4.

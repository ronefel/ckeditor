/**
 * QFieldsRenderer - Ponto de Entrada Principal
 * Inicializa estilos, escutas e expõe a API pública global.
 * O registro de campos é 100% automático: qualquer campo em src/fields/ é descoberto dinamicamente.
 */
(function (root) {
    'use strict';

    // Se estiver em ambiente Node.js / CommonJS
    var isNode = typeof module !== 'undefined' && module.exports;

    // Obtém Registry e Core
    var reg = (typeof FieldRegistry !== 'undefined') ? FieldRegistry : (isNode ? require('./core/registry') : root.FieldRegistry);
    var core = (typeof QFieldsCore !== 'undefined') ? QFieldsCore : (isNode ? require('./core/renderer') : root.QFieldsCore);

    // Se estiver em ambiente Node.js isolado (testes unitários), varre e carrega dinamicamente todos os arquivos de fields/
    if (isNode) {
        var fs = require('fs');
        var path = require('path');
        var fieldsDir = path.join(__dirname, 'fields');
        if (fs.existsSync(fieldsDir)) {
            fs.readdirSync(fieldsDir).forEach(function (file) {
                if (file.endsWith('.js')) {
                    var fieldDef = require(path.join(fieldsDir, file));
                    if (fieldDef && fieldDef.type) {
                        reg.register(fieldDef);
                    }
                }
            });
        }
    }

    // Inicializa folhas de estilo e listeners interativos quando executando no navegador
    if (typeof document !== 'undefined') {
        core.injectStyles(reg.getAll());

        var all = reg.getAll();
        for (var key in all) {
            if (all.hasOwnProperty(key) && typeof all[key].init === 'function') {
                all[key].init();
            }
        }
    }

    /**
     * Interface Pública do QFieldsRenderer
     */
    var QFieldsRenderer = {
        /**
         * Renderiza o HTML do editor em um formulário preenchível ou documento
         * @param {string} htmlTemplate - HTML contendo os widgets .qfield-widget
         * @param {object} [options] - Opções de estilização ou objeto de respostas
         */
        render: function (htmlTemplate, options) {
            return core.render(htmlTemplate, options, reg);
        },

        /**
         * Renderiza o questionário preenchido com as respostas passadas.
         * Por padrão mantém o formato de formulário editável com os inputs preenchidos.
         * @param {string} htmlTemplate - HTML do questionário
         * @param {object} answers - Objeto chave/valor com as respostas { nome: 'João', ... }
         * @param {object} [options] - Opções adicionais de customização
         */
        renderWithAnswers: function (htmlTemplate, answers, options) {
            options = options || {};
            var merged = {};
            for (var k in options) {
                if (options.hasOwnProperty(k)) merged[k] = options[k];
            }
            merged.values = answers || options.values || options.answers || {};
            return core.render(htmlTemplate, merged, reg);
        },

        /**
         * Renderiza o questionário com as respostas no modo documento final estático / laudo (somente leitura para visualização e impressão).
         * @param {string} htmlTemplate - HTML do questionário
         * @param {object} answers - Objeto chave/valor com as respostas
         * @param {object} [options] - Opções adicionais
         */
        renderDocument: function (htmlTemplate, answers, options) {
            options = options || {};
            var merged = {};
            for (var k in options) {
                if (options.hasOwnProperty(k)) merged[k] = options[k];
            }
            merged.values = answers || options.values || options.answers || {};
            merged.readOnly = true;
            return core.render(htmlTemplate, merged, reg);
        },

        /**
         * Formatação utilitária de máscaras (obtida dinamicamente do campo text)
         */
        formatWithMask: function (value, mask) {
            var textField = reg.get('text');
            return textField && typeof textField.formatWithMask === 'function'
                ? textField.formatWithMask(value, mask)
                : value;
        },

        /**
         * Permite registrar um novo tipo de campo customizado em tempo de execução
         */
        registerField: function (type, definition) {
            reg.register(type, definition);
            if (typeof document !== 'undefined') {
                if (definition && definition.styles) {
                    core.injectStyles(reg.getAll());
                }
                if (definition && typeof definition.init === 'function') {
                    definition.init();
                }
            }
        },

        /**
         * Retorna a definição de um tipo de campo registrado
         */
        getField: function (type) {
            return reg.get(type);
        }
    };

    // Exportação para Node / CommonJS
    if (isNode) {
        module.exports = QFieldsRenderer;
    }

    // Exportação para Browser
    if (typeof window !== 'undefined') {
        window.QFieldsRenderer = QFieldsRenderer;
    }

})(typeof window !== 'undefined' ? window : this);

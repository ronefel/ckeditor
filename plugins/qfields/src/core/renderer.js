/**
 * Orquestrador do Renderizador (QFields Core Renderer)
 * Responsável por percorrer o HTML do template, instanciar cada campo via Registry
 * e formatar eventuais inputs nativos legados.
 */
var QFieldsCore = (function () {
    'use strict';

    /**
     * Injeta folhas de estilo CSS no documento caso ainda não tenham sido inseridas
     */
    function injectStyles(allFields) {
        if (typeof document === 'undefined') return;
        if (document.getElementById('qfields-renderer-styles')) return;

        var css = '';
        if (allFields) {
            for (var key in allFields) {
                if (allFields.hasOwnProperty(key) && allFields[key].styles) {
                    css += '\n' + allFields[key].styles;
                }
            }
        }

        if (css.trim()) {
            var style = document.createElement('style');
            style.id = 'qfields-renderer-styles';
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    /**
     * Renderiza o HTML do template transformando os widgets nos inputs reais correspondentes
     * @param {string} htmlTemplate - HTML retornado pelo editor.getData()
     * @param {object} [options] - Opções de customização de classes
     * @param {object} registry - Registro com os tipos de campos disponíveis
     * @returns {string} HTML com o formulário pronto
     */
    function render(htmlTemplate, options, registry) {
        if (!htmlTemplate) return '';

        options = options || {};
        var textClass = options.textClass || 'qform-input-text';
        var selectClass = options.selectClass || 'qform-select';
        var textareaClass = options.textareaClass || 'qform-textarea';

        var wrapper = document.createElement('div');
        wrapper.innerHTML = htmlTemplate;

        // 1. Processa campos dinâmicos criados com o plugin qfields (.qfield-widget)
        var camposWidget = wrapper.querySelectorAll('.qfield-widget');

        camposWidget.forEach(function (campo) {
            var type = (campo.getAttribute('data-qfield-type') || 'text').toLowerCase();
            var fieldHandler = registry ? registry.get(type) : null;

            if (fieldHandler && typeof fieldHandler.render === 'function') {
                var targetNode = fieldHandler.render(campo, options);
                if (targetNode && campo.parentNode) {
                    campo.parentNode.replaceChild(targetNode, campo);
                }
            }
        });

        // 2. Garante que inputs HTML nativos sem classes também recebam os estilos do formulário
        var inputsNativos = wrapper.querySelectorAll('input:not([class]), select:not([class]), textarea:not([class])');
        inputsNativos.forEach(function (inputEl) {
            var tag = inputEl.tagName.toLowerCase();
            if (tag === 'textarea') {
                inputEl.className = textareaClass;
            } else if (tag === 'select') {
                inputEl.className = selectClass;
            } else if (inputEl.type === 'text') {
                inputEl.className = textClass;
            }
        });

        return wrapper.innerHTML;
    }

    return {
        render: render,
        injectStyles: injectStyles
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = QFieldsCore;
}

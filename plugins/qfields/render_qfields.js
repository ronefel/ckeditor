/**
 * QFieldsRenderer - Utilitário para converter o HTML do CKEditor 4 em um Formulário de Resposta
 * 
 * Uso:
 *   const htmlFormulario = QFieldsRenderer.render(htmlSalvoDoCKEditor);
 *   document.getElementById('meuContainer').innerHTML = htmlFormulario;
 */
var QFieldsRenderer = (function() {
    'use strict';

    /**
     * Renderiza o HTML do template transformando os widgets em inputs reais
     * @param {string} htmlTemplate - HTML retornado pelo editor.getData()
     * @param {object} [options] - Opções adicionais de customização de classes
     * @returns {string} HTML com o texto estático e os campos editáveis
     */
    function render(htmlTemplate, options) {
        if (!htmlTemplate) return '';

        options = options || {};
        var textClass = options.textClass || 'qform-input-text';
        var selectClass = options.selectClass || 'qform-select';
        var textareaClass = options.textareaClass || 'qform-textarea';
        var checkboxLabelClass = options.checkboxLabelClass || 'qform-checkbox-label';
        var radioLabelClass = options.radioLabelClass || 'qform-radio-label';

        var wrapper = document.createElement('div');
        wrapper.innerHTML = htmlTemplate;

        // 1. Processa campos criados com o plugin qfields (.qfield-widget)
        var camposWidget = wrapper.querySelectorAll('.qfield-widget');

        camposWidget.forEach(function(campo) {
            var type = campo.getAttribute('data-qfield-type') || 'text';
            var name = campo.getAttribute('data-qfield-name') || 'campo';
            var label = campo.getAttribute('data-qfield-label') || name;
            var width = campo.getAttribute('data-qfield-width') || 'auto';
            var height = campo.getAttribute('data-qfield-height') || 'auto';
            var isRequired = campo.getAttribute('data-qfield-required') === 'true';
            var placeholder = campo.getAttribute('data-qfield-placeholder') || '';
            var optionsRaw = campo.getAttribute('data-qfield-options') || '';

            var targetNode = null;

            switch (type) {
                case 'text':
                    var input = document.createElement('input');
                    input.type = 'text';
                    input.name = name;
                    input.className = textClass;
                    input.style.width = width;
                    input.style.maxWidth = '100%';
                    input.style.height = height || '22px';
                    input.style.backgroundColor = '#ffefbf';
                    input.style.border = 'none';
                    input.style.outline = 'none';
                    input.style.fontFamily = 'inherit';
                    input.style.fontSize = 'inherit';
                    input.style.color = '#000';
                    input.style.padding = '0 6px';
                    input.style.boxSizing = 'border-box';
                    input.style.verticalAlign = 'middle';
                    input.style.margin = '0 2px';
                    if (placeholder) input.placeholder = placeholder;
                    if (isRequired) input.required = true;
                    targetNode = input;
                    break;

                case 'textarea':
                    var textarea = document.createElement('textarea');
                    textarea.name = name;
                    textarea.className = textareaClass;
                    textarea.style.width = width || '100%';
                    textarea.style.maxWidth = '100%';
                    textarea.style.height = height || '60px';
                    textarea.style.minHeight = height || '60px';
                    textarea.style.backgroundColor = '#ffefbf';
                    textarea.style.border = 'none';
                    textarea.style.outline = 'none';
                    textarea.style.fontFamily = 'inherit';
                    textarea.style.fontSize = 'inherit';
                    textarea.style.color = '#000';
                    textarea.style.padding = '6px 8px';
                    textarea.style.boxSizing = 'border-box';
                    textarea.style.verticalAlign = 'top';
                    textarea.style.margin = '4px 0';
                    textarea.style.resize = 'vertical';
                    textarea.style.display = (width === '100%') ? 'block' : 'inline-block';
                    textarea.style.lineHeight = '1.4';
                    if (placeholder) textarea.placeholder = placeholder;
                    if (isRequired) textarea.required = true;
                    targetNode = textarea;
                    break;

                case 'select':
                    var select = document.createElement('select');
                    select.name = name;
                    select.className = selectClass;
                    select.style.width = width;
                    select.style.maxWidth = '100%';
                    select.style.height = height || '28px';
                    select.style.boxSizing = 'border-box';
                    select.style.verticalAlign = 'middle';
                    select.style.margin = '0 2px';
                    if (isRequired) select.required = true;

                    select.appendChild(new Option('-- Selecione --', ''));

                    var optionsList = optionsRaw.split(',');
                    optionsList.forEach(function(opt) {
                        var val = opt.trim();
                        if (val) select.appendChild(new Option(val, val));
                    });

                    targetNode = select;
                    break;

                case 'checkbox':
                    var chkContainer = document.createElement('span');
                    chkContainer.style.display = 'inline-block';
                    chkContainer.style.verticalAlign = 'middle';
                    chkContainer.style.margin = '2px 0';
                    var chkLabel = document.createElement('label');
                    chkLabel.className = checkboxLabelClass;
                    var chk = document.createElement('input');
                    chk.type = 'checkbox';
                    chk.name = name;
                    chk.value = '1';
                    if (isRequired) chk.required = true;

                    chkLabel.appendChild(chk);
                    chkLabel.appendChild(document.createTextNode(label));
                    chkContainer.appendChild(chkLabel);
                    targetNode = chkContainer;
                    break;

                case 'radio':
                    var radioContainer = document.createElement('span');
                    radioContainer.style.display = 'inline-block';
                    radioContainer.style.verticalAlign = 'middle';
                    radioContainer.style.margin = '2px 0';
                    var radioOptions = optionsRaw.split(',');
                    radioOptions.forEach(function(opt) {
                        var val = opt.trim();
                        if (val) {
                            var rLabel = document.createElement('label');
                            rLabel.className = radioLabelClass;
                            var radio = document.createElement('input');
                            radio.type = 'radio';
                            radio.name = name;
                            radio.value = val;
                            if (isRequired) radio.required = true;

                            rLabel.appendChild(radio);
                            rLabel.appendChild(document.createTextNode(val));
                            radioContainer.appendChild(rLabel);
                        }
                    });
                    targetNode = radioContainer;
                    break;
            }

            if (targetNode) {
                campo.parentNode.replaceChild(targetNode, campo);
            }
        });

        // 2. Garante que inputs HTML que por ventura já estejam no template também recebam estilos
        var inputsNativos = wrapper.querySelectorAll('input:not([class]), select:not([class]), textarea:not([class])');
        inputsNativos.forEach(function(inputEl) {
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
        render: render
    };
})();

// Suporte para Node / CommonJS se aplicável
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QFieldsRenderer;
}

/**
 * QFieldsRenderer - Utilitário para converter o HTML do CKEditor 4 em um Formulário de Resposta
 * 
 * Uso:
 *   const htmlFormulario = QFieldsRenderer.render(htmlSalvoDoCKEditor);
 *   document.getElementById('meuContainer').innerHTML = htmlFormulario;
 */
var QFieldsRenderer = (function () {
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

        camposWidget.forEach(function (campo) {
            var type = campo.getAttribute('data-qfield-type') || 'text';
            var name = campo.getAttribute('data-qfield-name') || 'campo';
            var label = campo.getAttribute('data-qfield-label') || '';
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
                    if (width) input.style.width = width;
                    if (height && height !== '22px') input.style.height = height;
                    if (placeholder) input.placeholder = placeholder;
                    if (isRequired) input.required = true;
                    targetNode = input;
                    break;

                case 'textarea':
                    var textarea = document.createElement('textarea');
                    textarea.name = name;
                    textarea.className = textareaClass;
                    if (width) textarea.style.width = width;
                    if (height) {
                        textarea.style.height = height;
                        textarea.style.minHeight = height;
                    }
                    if (placeholder) textarea.placeholder = placeholder;
                    if (isRequired) textarea.required = true;
                    targetNode = textarea;
                    break;

                case 'select':
                    var select = document.createElement('select');
                    select.name = name;
                    select.className = selectClass;
                    if (width) select.style.width = width;
                    if (height && height !== '22px') select.style.height = height;
                    if (isRequired) select.required = true;

                    var defaultOptionText = label || placeholder || '';
                    select.appendChild(new Option(defaultOptionText, ''));

                    var optionsList = optionsRaw ? optionsRaw.split(',') : [];
                    optionsList.forEach(function (opt) {
                        var val = opt.trim();
                        if (val) select.appendChild(new Option(val, val));
                    });

                    targetNode = select;
                    break;

                case 'checkbox':
                    var chkContainer = document.createElement('span');
                    chkContainer.className = 'qform-checkbox-container';

                    var chkLabel = document.createElement('label');
                    chkLabel.className = checkboxLabelClass || 'qform-checkbox-label';

                    var chk = document.createElement('input');
                    chk.type = 'checkbox';
                    chk.name = name;
                    chk.value = '1';
                    chk.className = 'qform-checkbox-input';
                    if (isRequired) chk.required = true;

                    var chkBox = document.createElement('span');
                    chkBox.className = 'qform-checkbox-box';
                    chkBox.innerHTML = '(&nbsp;<span class="qform-checkbox-mark">X</span>&nbsp;)';

                    chkLabel.appendChild(chk);
                    chkLabel.appendChild(chkBox);

                    if (label) {
                        var textSpan = document.createElement('span');
                        textSpan.className = 'qform-checkbox-text';
                        textSpan.textContent = ' ' + label;
                        chkLabel.appendChild(textSpan);
                    }

                    chkContainer.appendChild(chkLabel);
                    targetNode = chkContainer;
                    break;

                case 'radio':
                    var radioContainer = document.createElement('span');
                    radioContainer.style.display = 'inline-block';
                    radioContainer.style.verticalAlign = 'middle';
                    radioContainer.style.margin = '2px 0';
                    var radioOptions = optionsRaw.split(',');
                    radioOptions.forEach(function (opt) {
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
        render: render
    };
})();

// Suporte para Node / CommonJS se aplicável
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QFieldsRenderer;
}

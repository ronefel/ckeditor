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
            var defaultValue = campo.getAttribute('data-qfield-default') || '';

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

                    var mask = campo.getAttribute('data-qfield-mask') || '';
                    if (mask) {
                        input.setAttribute('data-qfield-mask', mask);
                    }

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

                    var defaultOptionText = label || placeholder || 'Selecione...';
                    var placeholderOption = new Option(defaultOptionText, '');
                    select.appendChild(placeholderOption);

                    var optionsList = optionsRaw ? optionsRaw.split(',') : [];
                    var effectiveSelectDefault = '';
                    if (optionsList.length > 0) {
                        optionsList.forEach(function (opt) {
                            var trimmed = opt.trim();
                            if (trimmed.indexOf('*') === 0) {
                                effectiveSelectDefault = trimmed.replace(/^\*/, '').trim();
                            }
                        });
                    }
                    if (!effectiveSelectDefault && defaultValue && defaultValue !== 'true' && defaultValue !== 'false') {
                        effectiveSelectDefault = defaultValue;
                    }

                    optionsList.forEach(function (opt) {
                        var val = opt.trim().replace(/^\*/, '').trim();
                        if (val) {
                            var optElem = new Option(val, val);
                            if (effectiveSelectDefault && val.toLowerCase() === effectiveSelectDefault.toLowerCase()) {
                                optElem.selected = true;
                                optElem.setAttribute('selected', 'selected');
                            }
                            select.appendChild(optElem);
                        }
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
                    var isChecked = defaultValue === 'true' || defaultValue === '1' || defaultValue === 'checked';
                    if (isChecked) {
                        chk.checked = true;
                        chk.setAttribute('checked', 'checked');
                    }

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
                    radioContainer.className = 'qform-radio-container';
                    var radioOptions = optionsRaw ? optionsRaw.split(',') : [];
                    var effectiveRadioDefault = '';
                    if (radioOptions.length > 0) {
                        radioOptions.forEach(function (opt) {
                            var trimmed = opt.trim();
                            if (trimmed.indexOf('*') === 0) {
                                effectiveRadioDefault = trimmed.replace(/^\*/, '').trim();
                            }
                        });
                    }
                    if (!effectiveRadioDefault && defaultValue && defaultValue !== 'true' && defaultValue !== 'false') {
                        effectiveRadioDefault = defaultValue;
                    }

                    if (radioOptions.length > 0) {
                        radioOptions.forEach(function (opt) {
                            var val = opt.trim().replace(/^\*/, '').trim();
                            if (val) {
                                var rLabel = document.createElement('label');
                                rLabel.className = radioLabelClass || 'qform-radio-label';

                                var radio = document.createElement('input');
                                radio.type = 'radio';
                                radio.name = name;
                                radio.value = val;
                                radio.className = 'qform-radio-input';
                                if (isRequired) radio.required = true;
                                if (effectiveRadioDefault && val.toLowerCase() === effectiveRadioDefault.toLowerCase()) {
                                    radio.checked = true;
                                    radio.setAttribute('checked', 'checked');
                                }

                                var radioBox = document.createElement('span');
                                radioBox.className = 'qform-radio-box';
                                radioBox.innerHTML = '(&nbsp;<span class="qform-radio-mark">X</span>&nbsp;)';

                                var textSpan = document.createElement('span');
                                textSpan.className = 'qform-radio-text';
                                textSpan.textContent = val;

                                rLabel.appendChild(radio);
                                rLabel.appendChild(radioBox);
                                rLabel.appendChild(textSpan);
                                radioContainer.appendChild(rLabel);
                            }
                        });
                    } else {
                        var rLabel = document.createElement('label');
                        rLabel.className = radioLabelClass || 'qform-radio-label';

                        var radio = document.createElement('input');
                        radio.type = 'radio';
                        radio.name = name;
                        var radioVal = label || name || '1';
                        radio.value = radioVal;
                        radio.className = 'qform-radio-input';
                        if (isRequired) radio.required = true;
                        if (defaultValue === 'true' || defaultValue === '1' || (defaultValue && defaultValue.toLowerCase() === radioVal.toLowerCase())) {
                            radio.checked = true;
                            radio.setAttribute('checked', 'checked');
                        }

                        var radioBox = document.createElement('span');
                        radioBox.className = 'qform-radio-box';
                        radioBox.innerHTML = '(&nbsp;<span class="qform-radio-mark">X</span>&nbsp;)';

                        rLabel.appendChild(radio);
                        rLabel.appendChild(radioBox);

                        if (label) {
                            var textSpan = document.createElement('span');
                            textSpan.className = 'qform-radio-text';
                            textSpan.textContent = label;
                            rLabel.appendChild(textSpan);
                        }
                        radioContainer.appendChild(rLabel);
                    }
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

    /**
     * Aplica uma máscara de formatação sobre um valor numérico/alfanumérico
     * Suporta padrões como 999.999.999-99 (CPF), (99) 99999-9999 (Telefone), 99/99/9999 (Data), etc.
     * @param {string} value - Valor atual do campo
     * @param {string} mask - Padrão da máscara
     * @returns {string} Valor formatado
     */
    function formatWithMask(value, mask) {
        if (!value || !mask) return value || '';

        var digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) return '';

        // Ajuste dinâmico inteligente para celular vs fixo no Brasil: (99) 9999-9999 vs (99) 99999-9999
        var effectiveMask = mask;
        if (mask === '(99) 99999-9999' || mask === '(99) 9999-9999') {
            effectiveMask = digitsOnly.length > 10 ? '(99) 99999-9999' : '(99) 9999-9999';
        }

        var formatted = '';
        var digitIndex = 0;

        for (var i = 0; i < effectiveMask.length && digitIndex < digitsOnly.length; i++) {
            var maskChar = effectiveMask.charAt(i);
            if (maskChar === '9' || maskChar === '0') {
                formatted += digitsOnly.charAt(digitIndex);
                digitIndex++;
            } else {
                formatted += maskChar;
            }
        }

        return formatted;
    }

    // Registra listener delegado automático para formatação instantânea ao digitar
    if (typeof document !== 'undefined') {
        document.addEventListener('input', function (event) {
            var target = event.target;
            if (target && target.getAttribute && target.getAttribute('data-qfield-mask')) {
                var maskPattern = target.getAttribute('data-qfield-mask');
                var currentVal = target.value;
                var formatted = formatWithMask(currentVal, maskPattern);
                if (currentVal !== formatted) {
                    target.value = formatted;
                }
            }
        });
    }

    return {
        render: render,
        formatWithMask: formatWithMask
    };
})();

// Suporte para Node / CommonJS se aplicável
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QFieldsRenderer;
}

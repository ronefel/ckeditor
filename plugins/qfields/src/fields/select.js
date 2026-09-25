/**
 * Campo de Seleção Suspensa (Select Field)
 * Suporta lista de opções separadas por vírgula, valor padrão pré-selecionado (marcado com * ou atributo default).
 */
var SelectField = (function () {
    'use strict';

    function render(campo, options) {
        options = options || {};
        var selectClass = options.selectClass || 'qform-select';

        var name = campo.getAttribute('data-qfield-name') || 'campo';
        var label = campo.getAttribute('data-qfield-label') || '';
        var width = campo.getAttribute('data-qfield-width') || 'auto';
        var height = campo.getAttribute('data-qfield-height') || 'auto';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';
        var placeholder = campo.getAttribute('data-qfield-placeholder') || '';
        var optionsRaw = campo.getAttribute('data-qfield-options') || '';
        var defaultValue = campo.getAttribute('data-qfield-default') || '';

        var values = options.values || options.answers || {};
        var rawValue = (values && values[name] !== undefined) ? values[name] : null;
        var selectedVal = (rawValue !== null && rawValue !== undefined) ? String(rawValue) : null;

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

        if (options.readOnly) {
            var answerSpan = document.createElement('span');
            answerSpan.className = options.answerSelectClass || 'qform-answer-select';
            if (width && width !== 'auto') {
                answerSpan.style.minWidth = width;
            }
            var displayAnswer = (selectedVal !== null) ? selectedVal : (effectiveSelectDefault || '');
            if (displayAnswer) {
                answerSpan.textContent = displayAnswer;
            } else {
                answerSpan.classList.add('qform-answer-empty');
                answerSpan.innerHTML = '&nbsp;';
            }
            return answerSpan;
        }

        var select = document.createElement('select');
        select.name = name;
        select.className = selectClass;
        if (width) select.style.width = width;
        if (height && height !== '22px') select.style.height = height;
        if (isRequired) select.required = true;

        var defaultOptionText = label || placeholder || 'Selecione...';
        var placeholderOption = new Option(defaultOptionText, '');
        select.appendChild(placeholderOption);

        optionsList.forEach(function (opt) {
            var val = opt.trim().replace(/^\*/, '').trim();
            if (val) {
                var optElem = new Option(val, val);
                var isSelected = false;
                if (selectedVal !== null) {
                    isSelected = (val.toLowerCase() === selectedVal.toLowerCase());
                } else if (effectiveSelectDefault) {
                    isSelected = (val.toLowerCase() === effectiveSelectDefault.toLowerCase());
                }
                if (isSelected) {
                    optElem.selected = true;
                    optElem.setAttribute('selected', 'selected');
                }
                select.appendChild(optElem);
            }
        });

        return select;
    }

    return {
        type: 'select',
        render: render
    };
})();

if (typeof FieldRegistry !== 'undefined') {
    FieldRegistry.register(SelectField);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SelectField;
}

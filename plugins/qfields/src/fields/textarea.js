/**
 * Campo de Área de Texto (Textarea Field)
 * Suporta largura, altura mínima/fixa, placeholder e validação obrigatória.
 */
var TextareaField = (function () {
    'use strict';

    function render(campo, options) {
        options = options || {};
        var textareaClass = options.textareaClass || 'qform-textarea';

        var name = campo.getAttribute('data-qfield-name') || 'campo';
        var width = campo.getAttribute('data-qfield-width') || 'auto';
        var height = campo.getAttribute('data-qfield-height') || 'auto';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';
        var placeholder = campo.getAttribute('data-qfield-placeholder') || '';

        var values = options.values || options.answers || {};
        var rawValue = (values && values[name] !== undefined) ? values[name] : null;
        var value = (rawValue !== null && rawValue !== undefined) ? String(rawValue) : '';

        if (options.readOnly) {
            var div = document.createElement('div');
            div.className = options.answerTextareaClass || 'qform-answer-textarea';
            if (width) div.style.width = width;
            if (height) div.style.minHeight = height;
            if (value) {
                div.textContent = value;
            } else {
                div.classList.add('qform-answer-empty');
                div.innerHTML = '&nbsp;';
            }
            return div;
        }

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
        if (value) textarea.value = value;

        return textarea;
    }

    return {
        type: 'textarea',
        render: render
    };
})();

if (typeof FieldRegistry !== 'undefined') {
    FieldRegistry.register(TextareaField);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextareaField;
}

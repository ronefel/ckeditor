/**
 * Campo de Texto (Text Field)
 * Suporta atributos de dimensão, obrigatoriedade, placeholder e máscara dinâmica em tempo real.
 */
var TextField = (function () {
    'use strict';

    /**
     * Aplica uma máscara de formatação sobre um valor numérico/alfanumérico.
     * Suporta padrões como 999.999.999-99 (CPF), (99) 99999-9999 (Telefone), 99/99/9999 (Data), etc.
     */
    function formatWithMask(value, mask) {
        if (!value || !mask) return value || '';

        var digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) return '';

        // Ajuste dinâmico para celular vs fixo no Brasil: (99) 9999-9999 vs (99) 99999-9999
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

    /**
     * Converte o elemento .qfield-widget de texto em um <input type="text">
     */
    function render(campo, options) {
        options = options || {};
        var textClass = options.textClass || 'qform-input-text';

        var name = campo.getAttribute('data-qfield-name') || 'campo';
        var width = campo.getAttribute('data-qfield-width') || 'auto';
        var height = campo.getAttribute('data-qfield-height') || 'auto';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';
        var placeholder = campo.getAttribute('data-qfield-placeholder') || '';
        var mask = campo.getAttribute('data-qfield-mask') || '';

        var values = options.values || options.answers || {};
        var rawValue = (values && values[name] !== undefined) ? values[name] : null;
        var value = (rawValue !== null && rawValue !== undefined) ? String(rawValue) : '';
        if (value && mask) {
            value = formatWithMask(value, mask);
        }

        if (options.readOnly) {
            var span = document.createElement('span');
            span.className = options.answerTextClass || 'qform-answer-text';
            if (width && width !== 'auto') {
                span.style.minWidth = width;
            }
            if (value) {
                span.textContent = value;
            } else {
                // span.classList.add('qform-answer-empty');
                span.innerHTML = '&nbsp;';
            }
            return span;
        }

        var input = document.createElement('input');
        input.type = 'text';
        input.name = name;
        input.className = textClass;
        if (width) input.style.width = width;
        if (height && height !== '22px') input.style.height = height;
        if (placeholder) input.placeholder = placeholder;
        if (isRequired) input.required = true;
        if (value) input.value = value;

        if (mask) {
            input.setAttribute('data-qfield-mask', mask);
        }

        return input;
    }

    /**
     * Inicializa o listener de digitação em tempo real para campos com máscara
     */
    function init() {
        if (typeof document === 'undefined') return;

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
        type: 'text',
        render: render,
        init: init,
        formatWithMask: formatWithMask
    };
})();

if (typeof FieldRegistry !== 'undefined') {
    FieldRegistry.register(TextField);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextField;
}

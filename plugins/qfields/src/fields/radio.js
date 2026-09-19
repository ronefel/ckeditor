/**
 * Campo de Botão de Opção (Radio Field)
 * Renderiza grupo de opções de rádio (ou rádio único) com indicador estilizado ( X ).
 */
var RadioField = (function () {
    'use strict';

    function render(campo, options) {
        options = options || {};
        var radioLabelClass = options.radioLabelClass || 'qform-radio-label';

        var name = campo.getAttribute('data-qfield-name') || 'campo';
        var label = campo.getAttribute('data-qfield-label') || '';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';
        var optionsRaw = campo.getAttribute('data-qfield-options') || '';
        var defaultValue = campo.getAttribute('data-qfield-default') || '';

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
                    rLabel.className = radioLabelClass;

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
            rLabel.className = radioLabelClass;

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

        return radioContainer;
    }

    return {
        type: 'radio',
        render: render
    };
})();

if (typeof FieldRegistry !== 'undefined') {
    FieldRegistry.register(RadioField);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RadioField;
}

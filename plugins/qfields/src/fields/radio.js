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

        var values = options.values || options.answers || {};
        var rawValue = (values && values[name] !== undefined) ? values[name] : null;
        var answeredVal = (rawValue !== null && rawValue !== undefined) ? String(rawValue) : null;

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

        if (options.readOnly) {
            var roContainer = document.createElement('span');
            roContainer.className = 'qform-answer-radio-container';
            if (radioOptions.length > 0) {
                radioOptions.forEach(function (opt) {
                    var val = opt.trim().replace(/^\*/, '').trim();
                    if (val) {
                        var isChecked = false;
                        if (answeredVal !== null) {
                            isChecked = (val.toLowerCase() === answeredVal.toLowerCase());
                        } else if (effectiveRadioDefault) {
                            isChecked = (val.toLowerCase() === effectiveRadioDefault.toLowerCase());
                        }

                        var itemSpan = document.createElement('span');
                        itemSpan.className = 'qform-answer-radio-item';

                        var rBox = document.createElement('span');
                        // rBox.className = 'qform-radio-box';
                        rBox.innerHTML = '(&nbsp;<span class="qform-radio-mark" style="visibility: ' + (isChecked ? 'visible' : 'hidden') + ';">X</span>&nbsp;)';

                        var textSpan = document.createElement('span');
                        textSpan.className = 'qform-radio-text';
                        textSpan.textContent = val;

                        itemSpan.appendChild(rBox);
                        itemSpan.appendChild(textSpan);
                        roContainer.appendChild(itemSpan);
                    }
                });
            } else {
                var radioVal = label || name || '1';
                var isChecked = false;
                if (answeredVal !== null) {
                    isChecked = (answeredVal === 'true' || answeredVal === '1' || answeredVal.toLowerCase() === radioVal.toLowerCase());
                } else {
                    isChecked = (defaultValue === 'true' || defaultValue === '1' || (defaultValue && defaultValue.toLowerCase() === radioVal.toLowerCase()));
                }

                var itemSpan = document.createElement('span');
                itemSpan.className = 'qform-answer-radio-item';

                var rBox = document.createElement('span');
                rBox.className = 'qform-radio-box';
                rBox.innerHTML = '(&nbsp;<span class="qform-radio-mark" style="visibility: ' + (isChecked ? 'visible' : 'hidden') + ';">X</span>&nbsp;)';

                itemSpan.appendChild(rBox);

                if (label) {
                    var textSpan = document.createElement('span');
                    textSpan.className = 'qform-radio-text';
                    textSpan.textContent = label;
                    itemSpan.appendChild(textSpan);
                }
                roContainer.appendChild(itemSpan);
            }
            return roContainer;
        }

        var radioContainer = document.createElement('span');
        radioContainer.className = 'qform-radio-container';

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

                    var isSelected = false;
                    if (answeredVal !== null) {
                        isSelected = (val.toLowerCase() === answeredVal.toLowerCase());
                    } else if (effectiveRadioDefault) {
                        isSelected = (val.toLowerCase() === effectiveRadioDefault.toLowerCase());
                    }
                    if (isSelected) {
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

            var isSelected = false;
            if (answeredVal !== null) {
                isSelected = (answeredVal === 'true' || answeredVal === '1' || answeredVal.toLowerCase() === radioVal.toLowerCase());
            } else {
                isSelected = (defaultValue === 'true' || defaultValue === '1' || (defaultValue && defaultValue.toLowerCase() === radioVal.toLowerCase()));
            }
            if (isSelected) {
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

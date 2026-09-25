/**
 * Campo de Caixa de Seleção (Checkbox Field)
 * Renderiza um checkbox acessível com indicador visual estilizado no padrão formulário ( X ).
 */
var CheckboxField = (function () {
    'use strict';

    function render(campo, options) {
        options = options || {};
        var checkboxLabelClass = options.checkboxLabelClass || 'qform-checkbox-label';

        var name = campo.getAttribute('data-qfield-name') || 'campo';
        var label = campo.getAttribute('data-qfield-label') || '';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';
        var defaultValue = campo.getAttribute('data-qfield-default') || '';

        var values = options.values || options.answers || {};
        var isChecked = false;
        if (values && values[name] !== undefined) {
            var val = values[name];
            if (Array.isArray(val)) {
                isChecked = val.indexOf('1') !== -1 || val.indexOf('true') !== -1 || (label && val.indexOf(label) !== -1) || val.indexOf(name) !== -1;
            } else {
                isChecked = (val === true || val === 'true' || val === '1' || val === 1 || val === 'checked' || (label && String(val).toLowerCase() === label.toLowerCase()));
            }
        } else {
            isChecked = defaultValue === 'true' || defaultValue === '1' || defaultValue === 'checked';
        }

        if (options.readOnly) {
            var answerSpan = document.createElement('span');
            answerSpan.className = 'qform-answer-checkbox';

            var chkBoxReadOnly = document.createElement('span');
            // chkBoxReadOnly.className = 'qform-checkbox-box';
            chkBoxReadOnly.innerHTML = '(&nbsp;<span class="qform-checkbox-mark" style="visibility: ' + (isChecked ? 'visible' : 'hidden') + ';">X</span>&nbsp;)';
            answerSpan.appendChild(chkBoxReadOnly);

            if (label) {
                var textSpanReadOnly = document.createElement('span');
                textSpanReadOnly.className = 'qform-checkbox-text';
                textSpanReadOnly.textContent = ' ' + label;
                answerSpan.appendChild(textSpanReadOnly);
            }
            return answerSpan;
        }

        var chkContainer = document.createElement('span');
        chkContainer.className = 'qform-checkbox-container';

        var chkLabel = document.createElement('label');
        chkLabel.className = checkboxLabelClass;

        var chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.name = name;
        chk.value = '1';
        chk.className = 'qform-checkbox-input';
        if (isRequired) chk.required = true;

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
        return chkContainer;
    }

    return {
        type: 'checkbox',
        render: render
    };
})();

if (typeof FieldRegistry !== 'undefined') {
    FieldRegistry.register(CheckboxField);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckboxField;
}

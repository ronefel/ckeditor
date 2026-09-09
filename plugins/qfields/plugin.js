/**
 * Plugin qfields para CKEditor 4
 * Permite a inserção de campos/variáveis para montagem de questionários e formulários.
 */
(function () {
    'use strict';

    CKEDITOR.plugins.add('qfields', {
        requires: 'widget,dialog',
        icons: 'qfield',

        init: function (editor) {
            // Registra o diálogo de configuração
            CKEDITOR.dialog.add('qfieldDialog', this.path + 'dialogs/qfield.js');

            // Registra o Widget
            editor.widgets.add('qfield', {
                button: 'Inserir Campo do Questionário',
                dialog: 'qfieldDialog',
                inline: true,
                allowedContent: true,

                template:
                    '<span class="qfield-widget" data-qfield-type="text" data-qfield-name="campo" data-qfield-label="Campo" data-qfield-width="200px" data-qfield-height="auto" data-qfield-required="false" data-qfield-placeholder="" data-qfield-options="" data-qfield-default="">' +
                    '<span class="qfield-text-val">campo</span>' +
                    '</span>',

                // Upcast: Identifica o elemento no HTML ao carregar ou voltar do Código-Fonte
                upcast: function (element) {
                    return element.name === 'span' && element.hasClass('qfield-widget');
                },

                // Inicializa os dados do Widget a partir dos atributos data-*
                init: function () {
                    var el = this.element;
                    var type = el.getAttribute('data-qfield-type') || 'text';
                    var name = el.getAttribute('data-qfield-name') || 'campo';
                    var label = el.hasAttribute('data-qfield-label') ? el.getAttribute('data-qfield-label') : '';
                    var width = el.getAttribute('data-qfield-width') || ((type === 'checkbox' || type === 'radio') ? 'auto' : '200px');
                    var height = el.getAttribute('data-qfield-height') || ((type === 'text' || type === 'select') ? '22px' : (type === 'textarea' ? '60px' : 'auto'));
                    var required = el.getAttribute('data-qfield-required') === 'true';
                    var placeholder = el.getAttribute('data-qfield-placeholder') || '';
                    var options = el.getAttribute('data-qfield-options') || '';
                    var defaultValue = el.getAttribute('data-qfield-default') || '';

                    this.setData('type', type);
                    this.setData('name', name);
                    this.setData('label', label);
                    this.setData('width', width);
                    this.setData('height', height);
                    this.setData('required', required);
                    this.setData('placeholder', placeholder);
                    this.setData('options', options);
                    this.setData('defaultValue', defaultValue);
                },

                // Atualiza a visualização e atributos sempre que os dados mudam
                data: function () {
                    var el = this.element;
                    var type = this.data.type || 'text';
                    var name = this.data.name || 'campo';
                    var label = this.data.label !== undefined ? this.data.label : '';
                    var width = this.data.width || '200px';
                    var height = this.data.height || '32px';
                    var required = !!this.data.required;
                    var placeholder = this.data.placeholder || '';
                    var options = this.data.options || '';
                    var defaultValue = this.data.defaultValue !== undefined ? this.data.defaultValue : '';
                    var displayVal = label || placeholder || name || '';

                    // Normaliza unidades de tamanho (se usuário digitou apenas número, assume px)
                    if (width && !isNaN(width)) width += 'px';
                    if (height && !isNaN(height)) height += 'px';

                    // Salva atributos nos data-*
                    el.setAttribute('data-qfield-type', type);
                    el.setAttribute('data-qfield-name', name);
                    el.setAttribute('data-qfield-label', label);
                    el.setAttribute('data-qfield-width', width);
                    el.setAttribute('data-qfield-height', height);
                    el.setAttribute('data-qfield-required', required ? 'true' : 'false');
                    el.setAttribute('data-qfield-placeholder', placeholder);
                    el.setAttribute('data-qfield-options', options);
                    el.setAttribute('data-qfield-default', defaultValue);

                    // Mantém inline apenas as dimensões personalizadas pelo usuário
                    if (width) el.setStyle('width', width);
                    if (height) el.setStyle('height', height);

                    // Aplica dimensões no wrapper em tempo de execução (não afeta o HTML salvo)
                    if (this.wrapper) {
                        this.wrapper.setStyle('box-sizing', 'border-box');
                        this.wrapper.setStyle('max-width', '100%');
                        this.wrapper.setStyle('width', width);
                        if (width === '100%') {
                            this.wrapper.setStyle('display', 'block');
                            this.wrapper.setStyle('clear', 'both');
                        } else {
                            this.wrapper.setStyle('display', 'inline-block');
                            this.wrapper.setStyle('vertical-align', type === 'textarea' ? 'top' : 'middle');
                        }
                    }

                    if (type === 'text') {
                        // Estilo limpo: retângulo amarelo claro uniforme
                        el.removeClass('qfield-badge-container');
                        el.removeClass('qfield-textarea-styled');
                        el.removeClass('qfield-select-styled');
                        el.removeClass('qfield-checkbox-styled');
                        el.removeClass('qfield-radio-styled');
                        el.addClass('qfield-text-styled');

                        var innerHtml = displayVal ? CKEDITOR.tools.htmlEncode(displayVal) : '&nbsp;';
                        el.setHtml('<span class="qfield-text-val">' + innerHtml + '</span>');
                    } else if (type === 'textarea') {
                        // Estilo textarea limpo: bloco amarelo claro uniforme multi-linhas
                        el.removeClass('qfield-badge-container');
                        el.removeClass('qfield-text-styled');
                        el.removeClass('qfield-select-styled');
                        el.removeClass('qfield-checkbox-styled');
                        el.removeClass('qfield-radio-styled');
                        el.addClass('qfield-textarea-styled');

                        if (this.wrapper) {
                            this.wrapper.setStyle('line-height', 'normal');
                        }

                        var innerHtml = displayVal ? CKEDITOR.tools.htmlEncode(displayVal) : '&nbsp;';
                        el.setHtml('<span class="qfield-textarea-val">' + innerHtml + '</span>');
                    } else if (type === 'select') {
                        // Estilo select limpo: retângulo amarelo claro uniforme com seta discreta
                        el.removeClass('qfield-badge-container');
                        el.removeClass('qfield-text-styled');
                        el.removeClass('qfield-textarea-styled');
                        el.removeClass('qfield-checkbox-styled');
                        el.removeClass('qfield-radio-styled');
                        el.addClass('qfield-select-styled');

                        if (this.wrapper) {
                            this.wrapper.setStyle('line-height', 'normal');
                        }

                        var selectOptions = options ? options.split(',') : [];
                        var effectiveDefault = '';
                        if (selectOptions.length > 0) {
                            selectOptions.forEach(function (opt) {
                                var trimmed = opt.trim();
                                if (trimmed.indexOf('*') === 0) {
                                    effectiveDefault = trimmed.replace(/^\*/, '').trim();
                                }
                            });
                        }
                        if (!effectiveDefault && defaultValue && defaultValue !== 'true' && defaultValue !== 'false') {
                            effectiveDefault = defaultValue;
                        }

                        var selectDisplayVal = effectiveDefault || displayVal;
                        var innerHtml = selectDisplayVal ? CKEDITOR.tools.htmlEncode(selectDisplayVal) : '&nbsp;';
                        el.setHtml(
                            '<span class="qfield-select-val">' + innerHtml + '</span>' +
                            '<span class="qfield-select-arrow">&#9662;</span>'
                        );
                    } else if (type === 'checkbox') {
                        // Estilo checkbox limpo: ( X ) ou (   ) com rótulo opcional
                        el.removeClass('qfield-badge-container');
                        el.removeClass('qfield-text-styled');
                        el.removeClass('qfield-textarea-styled');
                        el.removeClass('qfield-select-styled');
                        el.removeClass('qfield-radio-styled');
                        el.addClass('qfield-checkbox-styled');

                        if (this.wrapper) {
                            this.wrapper.setStyle('line-height', 'normal');
                            this.wrapper.setStyle('display', 'inline-block');
                        }

                        var isChecked = defaultValue === 'true' || defaultValue === '1' || defaultValue === 'checked';
                        var mark = isChecked ? 'X' : '&nbsp;';
                        var labelText = label || placeholder || '';
                        var labelHtml = labelText ? '<span class="qfield-checkbox-label">' + CKEDITOR.tools.htmlEncode(labelText) + '</span>' : '';
                        el.setHtml('<span class="qfield-checkbox-box">(&nbsp;<span class="qfield-checkbox-mark">' + mark + '</span>&nbsp;)</span>' + labelHtml);
                    } else if (type === 'radio') {
                        // Estilo radio limpo: ( X ) com opções ou rótulo
                        el.removeClass('qfield-badge-container');
                        el.removeClass('qfield-text-styled');
                        el.removeClass('qfield-textarea-styled');
                        el.removeClass('qfield-select-styled');
                        el.removeClass('qfield-checkbox-styled');
                        el.addClass('qfield-radio-styled');

                        if (this.wrapper) {
                            this.wrapper.setStyle('line-height', 'normal');
                            this.wrapper.setStyle('display', 'inline-block');
                        }

                        var radioOptions = options ? options.split(',') : [];
                        var effectiveDefault = '';
                        if (radioOptions.length > 0) {
                            radioOptions.forEach(function (opt) {
                                var trimmed = opt.trim();
                                if (trimmed.indexOf('*') === 0) {
                                    effectiveDefault = trimmed.replace(/^\*/, '').trim();
                                }
                            });
                        }
                        if (!effectiveDefault && defaultValue && defaultValue !== 'true' && defaultValue !== 'false') {
                            effectiveDefault = defaultValue;
                        }

                        var radioHtml = '';

                        if (radioOptions.length > 0) {
                            radioHtml = radioOptions.map(function (opt) {
                                var cleanVal = opt.trim().replace(/^\*/, '').trim();
                                if (!cleanVal) return '';
                                var isSelected = effectiveDefault && (cleanVal.toLowerCase() === effectiveDefault.toLowerCase());
                                var mark = isSelected ? 'X' : '&nbsp;';
                                return '<span class="qfield-radio-item"><span class="qfield-radio-box">(&nbsp;<span class="qfield-radio-mark">' + mark + '</span>&nbsp;)</span><span class="qfield-radio-label">' + CKEDITOR.tools.htmlEncode(cleanVal) + '</span></span>';
                            }).filter(Boolean).join('');
                        }

                        if (!radioHtml) {
                            var isChecked = defaultValue === 'true' || defaultValue === '1' || (defaultValue && defaultValue.toLowerCase() === (label || name).toLowerCase());
                            var mark = isChecked ? 'X' : '&nbsp;';
                            var labelText = label || placeholder || '';
                            var labelHtml = labelText ? '<span class="qfield-radio-label">' + CKEDITOR.tools.htmlEncode(labelText) + '</span>' : '';
                            radioHtml = '<span class="qfield-radio-item"><span class="qfield-radio-box">(&nbsp;<span class="qfield-radio-mark">' + mark + '</span>&nbsp;)</span>' + labelHtml + '</span>';
                        }

                        el.setHtml(radioHtml);
                    } else {
                        // Outros tipos de campo
                        el.removeClass('qfield-text-styled');
                        el.removeClass('qfield-textarea-styled');
                        el.removeClass('qfield-select-styled');
                        el.removeClass('qfield-checkbox-styled');
                        el.removeClass('qfield-radio-styled');
                        el.addClass('qfield-badge-container');

                        var reqBadge = required ? '<span class="qfield-badge-req" title="Obrigatório">*</span>' : '';
                        var typeStr = type.toUpperCase();
                        var previewText = label + (name !== label ? ' (' + name + ')' : '');

                        var badgeHtml =
                            '<span class="qfield-badge qfield-type-' + type + '">' +
                            '<span class="qfield-badge-type">' + typeStr + '</span>' +
                            '<span class="qfield-badge-name">' + CKEDITOR.tools.htmlEncode(previewText) + '</span>' +
                            reqBadge +
                            '</span>';

                        el.setHtml(badgeHtml);
                    }
                }
            });
            // Garante que o comando do widget permaneça habilitado
            editor.on('instanceReady', function () {
                var cmd = editor.getCommand('qfield');
                if (cmd) cmd.enable();
            });
            editor.on('selectionChange', function () {
                var cmd = editor.getCommand('qfield');
                if (cmd && cmd.state === CKEDITOR.TRISTATE_DISABLED && !editor.readOnly) {
                    cmd.enable();
                }
            });
            // Força a reativação dos widgets ao voltar do modo Código-Fonte
            editor.on('mode', function () {
                if (editor.mode === 'wysiwyg' && editor.widgets) {
                    editor.widgets.checkWidgets();
                }
            });
            // Adiciona atalho no menu de contexto
            if (editor.contextMenu) {
                editor.addMenuGroup('qfieldGroup');
                editor.addMenuItem('qfieldItem', {
                    label: 'Editar Campo do Questionário',
                    icon: this.path + 'icons/qfield.png',
                    command: 'qfield',
                    group: 'qfieldGroup'
                });

                editor.contextMenu.addListener(function (element) {
                    var widget = editor.widgets.getByElement(element);
                    if (widget && widget.name === 'qfield') {
                        return { qfieldItem: CKEDITOR.TRISTATE_OFF };
                    }
                });
            }
        }
    });
})();

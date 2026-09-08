/**
 * Plugin qfields para CKEditor 4
 * Permite a inserção de campos/variáveis para montagem de questionários e formulários.
 */
(function() {
    'use strict';

    CKEDITOR.plugins.add('qfields', {
        requires: 'widget,dialog',
        icons: 'qfield',

        init: function(editor) {
            // Registra o diálogo de configuração
            CKEDITOR.dialog.add('qfieldDialog', this.path + 'dialogs/qfield.js');

            // Registra o Widget
            editor.widgets.add('qfield', {
                button: 'Inserir Campo do Questionário',
                dialog: 'qfieldDialog',
                inline: true,
                allowedContent: true,

                template:
                    '<span class="qfield-widget" data-qfield-type="text" data-qfield-name="campo" data-qfield-label="Campo" data-qfield-width="200px" data-qfield-height="22px" data-qfield-required="false" data-qfield-placeholder="" data-qfield-options="">' +
                        '<span class="qfield-text-val">campo</span>' +
                    '</span>',

                // Upcast: Identifica o elemento no HTML ao carregar ou voltar do Código-Fonte
                upcast: function(element) {
                    return element.name === 'span' && element.hasClass('qfield-widget');
                },

                // Inicializa os dados do Widget a partir dos atributos data-*
                init: function() {
                    var el = this.element;
                    var type = el.getAttribute('data-qfield-type') || 'text';
                    var name = el.getAttribute('data-qfield-name') || 'campo';
                    var label = el.hasAttribute('data-qfield-label') ? el.getAttribute('data-qfield-label') : '';
                    var width = el.getAttribute('data-qfield-width') || (type === 'text' ? '200px' : '220px');
                    var height = el.getAttribute('data-qfield-height') || (type === 'text' ? '22px' : '32px');
                    var required = el.getAttribute('data-qfield-required') === 'true';
                    var placeholder = el.getAttribute('data-qfield-placeholder') || '';
                    var options = el.getAttribute('data-qfield-options') || '';

                    this.setData('type', type);
                    this.setData('name', name);
                    this.setData('label', label);
                    this.setData('width', width);
                    this.setData('height', height);
                    this.setData('required', required);
                    this.setData('placeholder', placeholder);
                    this.setData('options', options);
                },

                // Atualiza a visualização e atributos sempre que os dados mudam
                data: function() {
                    var el = this.element;
                    var type = this.data.type || 'text';
                    var name = this.data.name || 'campo';
                    var label = this.data.label !== undefined ? this.data.label : '';
                    var width = this.data.width || '220px';
                    var height = this.data.height || '32px';
                    var required = !!this.data.required;
                    var placeholder = this.data.placeholder || '';
                    var options = this.data.options || '';

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

                    // Estiliza o widget no editor para refletir dimensões reais
                    el.setStyle('box-sizing', 'border-box');
                    el.setStyle('width', width);
                    el.setStyle('max-width', '100%');

                    // Aplica dimensões e exibição no wrapper do widget para garantir que o CKEditor respeite a largura
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
                        // Estilo limpo idêntico à imagem de referência: retângulo amarelo claro uniforme
                        el.removeClass('qfield-badge-container');
                        el.removeClass('qfield-textarea-styled');
                        el.addClass('qfield-text-styled');
                        el.setStyle('display', 'inline-block');
                        el.setStyle('background-color', '#ffefbf');
                        el.setStyle('min-height', height || '22px');
                        el.setStyle('height', height || '22px');
                        el.setStyle('line-height', height || '22px');
                        el.setStyle('vertical-align', 'middle');
                        el.setStyle('padding', '0 6px');
                        el.setStyle('margin', '0 2px');
                        el.setStyle('border', 'none');
                        el.setStyle('cursor', 'pointer');

                        var displayVal = label || placeholder || '';
                        var innerHtml = displayVal ? CKEDITOR.tools.htmlEncode(displayVal) : '&nbsp;';
                        el.setHtml('<span class="qfield-text-val" style="display:inline-block;font-family:inherit;font-size:inherit;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">' + innerHtml + '</span>');
                    } else if (type === 'textarea') {
                        // Estilo textarea limpo: bloco amarelo claro uniforme multi-linhas
                        el.removeClass('qfield-badge-container');
                        el.removeClass('qfield-text-styled');
                        el.addClass('qfield-textarea-styled');
                        el.setStyle('display', width === '100%' ? 'block' : 'inline-block');
                        el.setStyle('background-color', '#ffefbf');
                        el.setStyle('min-height', height || '60px');
                        el.setStyle('height', height || '60px');
                        el.setStyle('line-height', '1.4');
                        el.setStyle('vertical-align', 'top');
                        el.setStyle('padding', '6px 8px');
                        el.setStyle('margin', '4px 0');
                        el.setStyle('border', 'none');
                        el.setStyle('cursor', 'pointer');
                        el.setStyle('box-sizing', 'border-box');

                        if (this.wrapper) {
                            this.wrapper.setStyle('line-height', 'normal');
                        }

                        var displayVal = label || placeholder || '';
                        var innerHtml = displayVal ? CKEDITOR.tools.htmlEncode(displayVal) : '&nbsp;';
                        el.setHtml('<span class="qfield-textarea-val" style="display:block;font-family:inherit;font-size:inherit;color:#111;line-height:1.4;white-space:pre-wrap;overflow:hidden;">' + innerHtml + '</span>');
                    } else {
                        // Outros tipos de campo (select, radio, checkbox)
                        el.removeClass('qfield-text-styled');
                        el.removeClass('qfield-textarea-styled');
                        el.addClass('qfield-badge-container');
                        el.setStyle('display', 'inline-flex');
                        el.setStyle('align-items', 'center');
                        el.setStyle('min-height', height);
                        el.setStyle('background-color', '#f8fafc');

                        var typeLabels = {
                            'select': 'SELECT',
                            'checkbox': 'CHECKBOX',
                            'radio': 'RADIO'
                        };

                        var reqBadge = required ? '<span class="qfield-badge-req" title="Obrigatório">*</span>' : '';
                        var typeStr = typeLabels[type] || type.toUpperCase();
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
            editor.on('instanceReady', function() {
                var cmd = editor.getCommand('qfield');
                if (cmd) cmd.enable();
            });
            editor.on('selectionChange', function() {
                var cmd = editor.getCommand('qfield');
                if (cmd && cmd.state === CKEDITOR.TRISTATE_DISABLED && !editor.readOnly) {
                    cmd.enable();
                }
            });
            // Força a reativação dos widgets ao voltar do modo Código-Fonte
            editor.on('mode', function() {
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

                editor.contextMenu.addListener(function(element) {
                    var widget = editor.widgets.getByElement(element);
                    if (widget && widget.name === 'qfield') {
                        return { qfieldItem: CKEDITOR.TRISTATE_OFF };
                    }
                });
            }
        }
    });
})();

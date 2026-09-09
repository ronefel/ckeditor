/**
 * Diálogo de configuração de Campo do Questionário (qfields)
 */
CKEDITOR.dialog.add('qfieldDialog', function (editor) {
    return {
        title: 'Formatar Campo',
        minWidth: 420,
        minHeight: 280,
        contents: [
            {
                id: 'tab-basic',
                label: 'Formatar Campo',
                elements: [
                    {
                        type: 'hbox',
                        widths: ['50%', '50%'],
                        children: [
                            {
                                id: 'name',
                                type: 'text',
                                label: 'Identificador',
                                'default': 'campo_1',
                                required: true,
                                validate: function () {
                                    var val = this.getValue();
                                    if (!val || !val.trim()) {
                                        alert('O nome da variável é obrigatório.');
                                        return false;
                                    }
                                    return true;
                                },
                                setup: function (widget) {
                                    this.setValue(widget.data.name || '');
                                },
                                commit: function (widget) {
                                    widget.setData('name', this.getValue().trim().replace(/\s+/g, '_'));
                                }
                            },
                            {
                                id: 'type',
                                type: 'select',
                                label: 'Tipo de Campo',
                                'default': 'text',
                                items: [
                                    ['Texto Simples (Input)', 'text'],
                                    ['Texto Longo (Textarea)', 'textarea'],
                                    ['Lista Suspensa (Select)', 'select'],
                                    ['Caixa de Seleção (Checkbox)', 'checkbox'],
                                    ['Múltipla Escolha (Radio)', 'radio']
                                ],
                                setup: function (widget) {
                                    this.setValue(widget.data.type || 'text');
                                },
                                commit: function (widget) {
                                    widget.setData('type', this.getValue());
                                },
                                onChange: function () {
                                    var dialog = this.getDialog();
                                    var heightInput = dialog.getContentElement('tab-advanced', 'height');
                                    var widthInput = dialog.getContentElement('tab-advanced', 'width');
                                    var currentType = this.getValue();

                                    if (heightInput) {
                                        if (currentType === 'text') {
                                            heightInput.setValue('auto');
                                            if (widthInput && widthInput.getValue() === '100%') widthInput.setValue('200px');
                                        } else if (currentType === 'textarea') {
                                            heightInput.setValue('70px');
                                            if (widthInput) widthInput.setValue('100%');
                                        } else if (currentType === 'select') {
                                            heightInput.setValue('auto');
                                            if (widthInput && widthInput.getValue() === '100%') widthInput.setValue('200px');
                                        } else if (currentType === 'checkbox' || currentType === 'radio') {
                                            heightInput.setValue('auto');
                                            if (widthInput) widthInput.setValue('auto');
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    {
                        id: 'label',
                        type: 'text',
                        label: 'Descrição do Campo (Opcional)',
                        'default': '',
                        setup: function (widget) {
                            this.setValue(widget.data.label || '');
                        },
                        commit: function (widget) {
                            widget.setData('label', this.getValue() ? this.getValue().trim() : '');
                        }
                    },
                    {
                        id: 'placeholder',
                        type: 'text',
                        label: 'Texto de Exemplo (Placeholder)',
                        'default': '',
                        setup: function (widget) {
                            this.setValue(widget.data.placeholder || '');
                        },
                        commit: function (widget) {
                            widget.setData('placeholder', this.getValue());
                        }
                    },
                    {
                        id: 'required',
                        type: 'checkbox',
                        label: 'Campo de preenchimento obrigatório (*)',
                        'default': false,
                        setup: function (widget) {
                            this.setValue(!!widget.data.required);
                        },
                        commit: function (widget) {
                            widget.setData('required', this.getValue());
                        }
                    },
                    {
                        id: 'defaultChecked',
                        type: 'checkbox',
                        label: 'Marcado inicialmente por padrão (para Checkbox)',
                        'default': false,
                        setup: function (widget) {
                            this.setValue(widget.data.defaultValue === 'true' || widget.data.defaultValue === '1');
                        },
                        commit: function (widget) {
                            if (widget.data.type === 'checkbox') {
                                widget.setData('defaultValue', this.getValue() ? 'true' : 'false');
                            }
                        }
                    }
                ]
            },
            {
                id: 'tab-advanced',
                label: 'Avançado',
                elements: [
                    {
                        type: 'hbox',
                        widths: ['50%', '50%'],
                        children: [
                            {
                                id: 'width',
                                type: 'text',
                                label: 'Largura (ex: 200px, 100%)',
                                'default': '200px',
                                setup: function (widget) {
                                    this.setValue(widget.data.width || '200px');
                                },
                                commit: function (widget) {
                                    var val = this.getValue().trim();
                                    if (val && !isNaN(val)) val += 'px';
                                    widget.setData('width', val || '200px');
                                }
                            },
                            {
                                id: 'height',
                                type: 'text',
                                label: 'Altura (ex: 32px, 80px)',
                                'default': 'auto',
                                setup: function (widget) {
                                    this.setValue(widget.data.height || 'auto');
                                },
                                commit: function (widget) {
                                    var val = this.getValue().trim();
                                    if (val && !isNaN(val)) val += 'px';
                                    widget.setData('height', val || 'auto');
                                }
                            }
                        ]
                    },
                    {
                        id: 'options',
                        type: 'textarea',
                        rows: 2,
                        label: 'Opções (para Select e Radio)',
                        'default': '',
                        setup: function (widget) {
                            this.setValue(widget.data.options || '');
                        },
                        commit: function (widget) {
                            widget.setData('options', this.getValue());
                        }
                    },
                    {
                        type: 'html',
                        html: '<div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.4; white-space: normal; background: #f8fafc; padding: 6px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">' +
                            '💡 Separe as opções por vírgula (ex: <code>Opção 1, *Opção 2, Opção 3</code>).<br>' +
                            'Coloque um asterisco (<code>*</code>) antes da opção para marcá-la como <strong>padrão</strong>.' +
                            '</div>'
                    },
                    {
                        id: 'mask',
                        type: 'text',
                        label: 'Máscara (para Texto Simples)',
                        'default': '',
                        setup: function (widget) {
                            this.setValue(widget.data.mask || '');
                        },
                        commit: function (widget) {
                            widget.setData('mask', this.getValue() ? this.getValue().trim() : '');
                        }
                    },
                    {
                        type: 'html',
                        html: '<div style="font-size: 12px; color: #475569; margin-top: -4px; margin-bottom: 8px; line-height: 1.4; white-space: normal; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">' +
                            '💡 (ex: <code>999.999.999-99</code> CPF, <code>(99) 99999-9999</code> Celular, <code>99/99/9999</code> Data, <code>99999-999</code> CEP).' +
                            '</div>'
                    },
                ]
            }
        ]
    };
});

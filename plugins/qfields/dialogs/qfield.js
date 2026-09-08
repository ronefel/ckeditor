/**
 * Diálogo de configuração de Campo do Questionário (qfields)
 */
CKEDITOR.dialog.add('qfieldDialog', function(editor) {
    return {
        title: 'Propriedades do Campo do Questionário',
        minWidth: 420,
        minHeight: 280,
        contents: [
            {
                id: 'tab-basic',
                label: 'Configurações do Campo',
                elements: [
                    {
                        type: 'hbox',
                        widths: ['50%', '50%'],
                        children: [
                            {
                                id: 'name',
                                type: 'text',
                                label: 'Nome da Variável / Identificador *',
                                'default': 'campo_1',
                                required: true,
                                validate: function() {
                                    var val = this.getValue();
                                    if (!val || !val.trim()) {
                                        alert('O nome da variável é obrigatório.');
                                        return false;
                                    }
                                    return true;
                                },
                                setup: function(widget) {
                                    this.setValue(widget.data.name || '');
                                },
                                commit: function(widget) {
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
                                setup: function(widget) {
                                    this.setValue(widget.data.type || 'text');
                                },
                                commit: function(widget) {
                                    widget.setData('type', this.getValue());
                                },
                                onChange: function() {
                                    var dialog = this.getDialog();
                                    var heightInput = dialog.getContentElement('tab-advanced', 'height');
                                    var widthInput = dialog.getContentElement('tab-advanced', 'width');
                                    var currentType = this.getValue();

                                    if (heightInput) {
                                        if (currentType === 'text') {
                                            heightInput.setValue('22px');
                                            if (widthInput && widthInput.getValue() === '100%') widthInput.setValue('200px');
                                        } else if (currentType === 'textarea') {
                                            heightInput.setValue('70px');
                                            if (widthInput) widthInput.setValue('100%');
                                        } else if (currentType === 'select') {
                                            heightInput.setValue('28px');
                                            if (widthInput && widthInput.getValue() === '100%') widthInput.setValue('200px');
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    {
                        id: 'label',
                        type: 'text',
                        label: 'Rótulo / Descrição do Campo (Opcional)',
                        'default': '',
                        setup: function(widget) {
                            this.setValue(widget.data.label || '');
                        },
                        commit: function(widget) {
                            widget.setData('label', this.getValue() ? this.getValue().trim() : '');
                        }
                    },
                    {
                        id: 'placeholder',
                        type: 'text',
                        label: 'Texto de Exemplo (Placeholder)',
                        'default': '',
                        setup: function(widget) {
                            this.setValue(widget.data.placeholder || '');
                        },
                        commit: function(widget) {
                            widget.setData('placeholder', this.getValue());
                        }
                    },
                    {
                        id: 'required',
                        type: 'checkbox',
                        label: 'Campo de preenchimento obrigatório (*)',
                        'default': false,
                        setup: function(widget) {
                            this.setValue(!!widget.data.required);
                        },
                        commit: function(widget) {
                            widget.setData('required', this.getValue());
                        }
                    }
                ]
            },
            {
                id: 'tab-advanced',
                label: 'Dimensões e Opções',
                elements: [
                    {
                        type: 'hbox',
                        widths: ['50%', '50%'],
                        children: [
                            {
                                id: 'width',
                                type: 'text',
                                label: 'Comprimento / Largura (ex: 220px, 100%)',
                                'default': '220px',
                                setup: function(widget) {
                                    this.setValue(widget.data.width || '220px');
                                },
                                commit: function(widget) {
                                    var val = this.getValue().trim();
                                    if (val && !isNaN(val)) val += 'px';
                                    widget.setData('width', val || '220px');
                                }
                            },
                            {
                                id: 'height',
                                type: 'text',
                                label: 'Altura (ex: 32px, 80px)',
                                'default': '32px',
                                setup: function(widget) {
                                    this.setValue(widget.data.height || '32px');
                                },
                                commit: function(widget) {
                                    var val = this.getValue().trim();
                                    if (val && !isNaN(val)) val += 'px';
                                    widget.setData('height', val || '32px');
                                }
                            }
                        ]
                    },
                    {
                        id: 'options',
                        type: 'textarea',
                        rows: 4,
                        label: 'Opções (para Select e Radio)',
                        'default': '',
                        note: 'Informe as opções separadas por vírgula (ex: Opção 1, Opção 2, Opção 3)',
                        setup: function(widget) {
                            this.setValue(widget.data.options || '');
                        },
                        commit: function(widget) {
                            widget.setData('options', this.getValue());
                        }
                    }
                ]
            }
        ]
    };
});

/**
 * Diálogo de Configurações da Página A4 (Margens)
 * Plugin a4pages para CKEditor 4
 */
CKEDITOR.dialog.add('a4PageDialog', function (editor) {
    'use strict';

    /**
     * Normaliza a entrada de margem garantindo que tenha unidade (cm como padrão)
     */
    function normalizarUnidade(val, fallback) {
        if (!val || !val.toString().trim()) return fallback || '1cm';
        var str = val.toString().trim().replace(',', '.');
        // Se já tiver unidade (cm, mm, px, pt, in)
        if (/[a-zA-Z%]$/.test(str)) {
            return str;
        }
        var num = parseFloat(str);
        if (isNaN(num)) return fallback || '1cm';
        // Se for número puro <= 10, assume centímetros
        if (num <= 10) return num + 'cm';
        // Se for maior, assume pixels
        return num + 'px';
    }

    /**
     * Converte valor em pixels para centímetros aproximados (96 DPI: 1cm = 37.795px)
     */
    function pxParaCm(px) {
        var n = parseFloat(px);
        if (isNaN(n)) return '1cm';
        var cm = (n / 37.795).toFixed(1);
        if (cm.endsWith('.0')) cm = cm.substring(0, cm.length - 2);
        return cm + 'cm';
    }

    return {
        title: 'Configurações da Página A4',
        minWidth: 420,
        minHeight: 260,

        contents: [
            {
                id: 'tab-margins',
                label: 'Margens da Página',
                elements: [
                    {
                        type: 'select',
                        id: 'preset',
                        label: 'Margens Predefinidas (Presets Rápidos)',
                        'default': 'custom',
                        items: [
                            ['Personalizada (digitar abaixo)', 'custom'],
                            ['Padrão Atual (1 cm em todos os lados)', '1cm'],
                            ['Normal / ABNT (Sup: 3cm, Esq: 3cm, Dir: 2cm, Inf: 2cm)', 'abnt'],
                            ['Moderada (Sup: 2.5cm, Esq: 2.5cm, Dir: 2cm, Inf: 2.5cm)', 'moderada'],
                            ['Estreita (1.27 cm / 0.5 pol em todos os lados)', 'estreita'],
                            ['Larga (Sup/Inf: 2.5cm, Esq/Dir: 4cm)', 'larga']
                        ],
                        onChange: function () {
                            var dialog = this.getDialog();
                            var val = this.getValue();
                            if (val === '1cm') {
                                dialog.setValueOf('tab-margins', 'top', '1cm');
                                dialog.setValueOf('tab-margins', 'bottom', '1cm');
                                dialog.setValueOf('tab-margins', 'left', '1cm');
                                dialog.setValueOf('tab-margins', 'right', '1cm');
                            } else if (val === 'abnt') {
                                dialog.setValueOf('tab-margins', 'top', '3cm');
                                dialog.setValueOf('tab-margins', 'bottom', '2cm');
                                dialog.setValueOf('tab-margins', 'left', '3cm');
                                dialog.setValueOf('tab-margins', 'right', '2cm');
                            } else if (val === 'moderada') {
                                dialog.setValueOf('tab-margins', 'top', '2.5cm');
                                dialog.setValueOf('tab-margins', 'bottom', '2.5cm');
                                dialog.setValueOf('tab-margins', 'left', '2cm');
                                dialog.setValueOf('tab-margins', 'right', '2cm');
                            } else if (val === 'estreita') {
                                dialog.setValueOf('tab-margins', 'top', '1.27cm');
                                dialog.setValueOf('tab-margins', 'bottom', '1.27cm');
                                dialog.setValueOf('tab-margins', 'left', '1.27cm');
                                dialog.setValueOf('tab-margins', 'right', '1.27cm');
                            } else if (val === 'larga') {
                                dialog.setValueOf('tab-margins', 'top', '2.5cm');
                                dialog.setValueOf('tab-margins', 'bottom', '2.5cm');
                                dialog.setValueOf('tab-margins', 'left', '4cm');
                                dialog.setValueOf('tab-margins', 'right', '4cm');
                            }
                        }
                    },
                    {
                        type: 'html',
                        html: '<div style="margin: 12px 0 6px 0; font-weight: bold; color: #334155; font-size: 13px;">Definir Margens Manuais:</div>'
                    },
                    {
                        type: 'hbox',
                        widths: ['50%', '50%'],
                        children: [
                            {
                                type: 'text',
                                id: 'top',
                                label: 'Margem Superior (Topo)',
                                'default': '1cm',
                                onChange: function () {
                                    this.getDialog().setValueOf('tab-margins', 'preset', 'custom');
                                }
                            },
                            {
                                type: 'text',
                                id: 'bottom',
                                label: 'Margem Inferior (Rodapé)',
                                'default': '1cm',
                                onChange: function () {
                                    this.getDialog().setValueOf('tab-margins', 'preset', 'custom');
                                }
                            }
                        ]
                    },
                    {
                        type: 'hbox',
                        widths: ['50%', '50%'],
                        children: [
                            {
                                type: 'text',
                                id: 'left',
                                label: 'Margem Esquerda',
                                'default': '1cm',
                                onChange: function () {
                                    this.getDialog().setValueOf('tab-margins', 'preset', 'custom');
                                }
                            },
                            {
                                type: 'text',
                                id: 'right',
                                label: 'Margem Direita',
                                'default': '1cm',
                                onChange: function () {
                                    this.getDialog().setValueOf('tab-margins', 'preset', 'custom');
                                }
                            }
                        ]
                    },
                    {
                        type: 'radio',
                        id: 'applyScope',
                        label: 'Aplicar Margens em:',
                        'default': 'all',
                        items: [
                            ['Todas as páginas do documento', 'all'],
                            ['Apenas na página atual', 'current']
                        ]
                    },
                    {
                        type: 'html',
                        html: '<div style="margin-top: 8px; font-size: 11px; color: #64748b;">Dica: Você pode digitar valores com unidades como <code>1cm</code>, <code>2.5cm</code>, <code>20mm</code> ou <code>30px</code>.</div>'
                    }
                ]
            }
        ],

        onShow: function () {
            var doc = editor.document;
            if (!doc) return;
            var body = doc.getBody();
            if (!body) return;

            // Encontra a folha atual ou a primeira
            var folha = null;
            var sel = editor.getSelection();
            if (sel) {
                var startEl = sel.getStartElement();
                if (startEl && startEl.getAscendant) {
                    folha = startEl.hasClass && startEl.hasClass('folha-a4') ? startEl : startEl.getAscendant(function (el) {
                        return el && el.hasClass && el.hasClass('folha-a4');
                    }, true);
                }
            }

            if (!folha) {
                var folhas = body.find('.folha-a4');
                if (folhas.count() > 0) folha = folhas.getItem(0);
            }

            if (folha && folha.$) {
                this._targetFolha = folha;
                var el = folha.$;
                var win = folha.getWindow ? folha.getWindow().$ : window;
                var style = win.getComputedStyle ? win.getComputedStyle(el) : el.style;

                // Tenta ler os estilos inline ou computados
                var padTop = folha.getStyle('padding-top') || pxParaCm(style.paddingTop);
                var padBottom = folha.getStyle('padding-bottom') || pxParaCm(style.paddingBottom);
                var padLeft = folha.getStyle('padding-left') || pxParaCm(style.paddingLeft);
                var padRight = folha.getStyle('padding-right') || pxParaCm(style.paddingRight);

                this.setValueOf('tab-margins', 'top', padTop);
                this.setValueOf('tab-margins', 'bottom', padBottom);
                this.setValueOf('tab-margins', 'left', padLeft);
                this.setValueOf('tab-margins', 'right', padRight);
                this.setValueOf('tab-margins', 'preset', 'custom');
                this.setValueOf('tab-margins', 'applyScope', 'all');
            }
        },

        onOk: function () {
            var top = normalizarUnidade(this.getValueOf('tab-margins', 'top'), '1cm');
            var bottom = normalizarUnidade(this.getValueOf('tab-margins', 'bottom'), '1cm');
            var left = normalizarUnidade(this.getValueOf('tab-margins', 'left'), '1cm');
            var right = normalizarUnidade(this.getValueOf('tab-margins', 'right'), '1cm');
            var scope = this.getValueOf('tab-margins', 'applyScope');

            var doc = editor.document;
            if (!doc) return;
            var body = doc.getBody();
            if (!body) return;

            // Salva as margens padrão no plugin para novas páginas herdarem automaticamente
            editor._a4MargensPadrao = {
                top: top,
                bottom: bottom,
                left: left,
                right: right
            };

            if (scope === 'current' && this._targetFolha) {
                // Aplica apenas na folha atual
                this._targetFolha.setStyle('padding-top', top);
                this._targetFolha.setStyle('padding-bottom', bottom);
                this._targetFolha.setStyle('padding-left', left);
                this._targetFolha.setStyle('padding-right', right);
            } else {
                // Aplica a todas as folhas A4
                var folhas = body.find('.folha-a4');
                for (var i = 0; i < folhas.count(); i++) {
                    var f = folhas.getItem(i);
                    f.setStyle('padding-top', top);
                    f.setStyle('padding-bottom', bottom);
                    f.setStyle('padding-left', left);
                    f.setStyle('padding-right', right);
                }
            }

            // Força recálculo imediato do fluxo de páginas (push e pull) com as novas margens
            setTimeout(function () {
                if (editor.fire) editor.fire('change');
            }, 50);
        }
    };
});

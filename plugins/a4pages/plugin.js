/**
 * Plugin a4pages para CKEditor 4
 * Gerencia documentos divididos em páginas físicas A4 (div.folha-a4)
 * com altura fixa e fluxo automático contínuo estilo Word:
 * - Se o texto ultrapassar a página atual, ele transborda automaticamente para a próxima página.
 * - Se a próxima página não existir, ela é criada automaticamente.
 * - Não permite escrever no vão cinza fora das páginas.
 */
(function () {
    'use strict';

    var emAjuste = false;
    var timerAjuste = null;

    CKEDITOR.plugins.add('a4pages', {
        requires: 'dialog',
        icons: 'a4page',

        init: function (editor) {
            // Registra o diálogo de configurações da página A4 (Margens)
            CKEDITOR.dialog.add('a4PageDialog', this.path + 'dialogs/a4page.js');

            // Comando para abrir o diálogo de configuração de página A4
            editor.addCommand('a4PageConfig', new CKEDITOR.dialogCommand('a4PageDialog'));

            // Comando para adicionar nova página A4 manualmente (compatibilidade com botões externos)
            editor.addCommand('addA4Page', {
                exec: function (editor) {
                    adicionarNovaPaginaManual(editor);
                }
            });

            // Botão na barra de ferramentas: Configurações da Página A4 (Margens)
            if (editor.ui.addButton) {
                editor.ui.addButton('AddA4Page', {
                    label: 'Configurações da Página A4 (Margens)',
                    command: 'a4PageConfig',
                    toolbar: 'document,50',
                    icon: this.path + 'icons/a4page.png'
                });
            }

            // Inicialização
            editor.on('instanceReady', function () {
                if (!editorSuportaA4Pages(editor)) return;
                garantirEstruturaA4(editor);
                instalarTravas(editor);
                // Executa a primeira paginação
                setTimeout(function () {
                    ajustarFluxoPaginas(editor);
                }, 100);
            });

            editor.on('setData', function () {
                if (!editorSuportaA4Pages(editor)) return;
                setTimeout(function () {
                    garantirEstruturaA4(editor);
                    ajustarFluxoPaginas(editor);
                }, 100);
            });
        }
    });

    /**
     * Verifica se a instância do editor deve gerenciar páginas A4 físicas.
     * Retorna falso para editores inline, utilitários do Toolbar Configurator
     * ou instâncias que compartilham o body da página hospedeira.
     */
    function editorSuportaA4Pages(editor) {
        if (!editor) return false;
        if (editor.config && editor.config.a4pages === false) return false;

        // Instâncias internas de utilitários como Toolbar Configurator
        if (editor.name && (editor.name.indexOf('fte') === 0 || editor.name === 'editor')) {
            // No Toolbar Configurator, a instância do editor tem o plugin toolbarconfiguratorarea
            if (editor.plugins && editor.plugins.toolbarconfiguratorarea) return false;
        }
        if (editor.plugins && editor.plugins.toolbarconfiguratorarea) {
            return false;
        }

        // Editores inline não possuem páginas físicas isoladas
        if (editor.editable && editor.editable() && editor.editable().isInline()) {
            return false;
        }

        // Se o body do editor for o mesmo body da janela principal (evita tocar no DOM hospedeiro)
        if (editor.document && editor.document.getBody) {
            try {
                var body = editor.document.getBody();
                if (!body || !body.$) return false;
                if (typeof CKEDITOR !== 'undefined' && CKEDITOR.document && CKEDITOR.document.getBody) {
                    if (body.equals(CKEDITOR.document.getBody())) {
                        return false;
                    }
                }
            } catch (e) {
                return false;
            }
        }

        return true;
    }

    /**
     * Encontra a folha A4 mais próxima a partir de um elemento
     */
    function obterFolhaAscendente(element) {
        if (!element || !element.getAscendant) return null;
        if (element.hasClass && element.hasClass('folha-a4')) return element;
        return element.getAscendant(function (el) {
            return el && el.hasClass && el.hasClass('folha-a4');
        }, true);
    }

    /**
     * Garante que todo o conteúdo esteja encapsulado em .folha-a4
     */
    function garantirEstruturaA4(editor) {
        if (!editorSuportaA4Pages(editor)) return;
        var doc = editor.document;
        if (!doc) return;
        var body = doc.getBody();
        if (!body) return;

        var folhas = body.find('.folha-a4');

        if (folhas.count() === 0) {
            var htmlExistente = body.getHtml().trim();
            if (!htmlExistente || htmlExistente === '<p><br></p>' || htmlExistente === '<p>&nbsp;</p>') {
                htmlExistente = '<p><br></p>';
            }
            body.setHtml('<div class="folha-a4" data-page="1">' + htmlExistente + '</div>');
        } else {
            moverNosOrfaosParaFolhas(editor);
            renumerarPaginas(editor);
        }
    }

    /**
     * Move qualquer elemento/texto solto fora das folhas para dentro da folha mais próxima
     */
    function moverNosOrfaosParaFolhas(editor) {
        if (!editorSuportaA4Pages(editor)) return;
        var body = editor.document.getBody();
        var children = body.getChildren();
        var ultimaFolha = null;

        for (var i = 0; i < children.count(); i++) {
            var child = children.getItem(i);
            if (child.hasClass && child.hasClass('folha-a4')) {
                ultimaFolha = child;
            } else if (child.getName && child.getName() !== 'script' && child.getName() !== 'style') {
                var texto = child.getText ? child.getText().trim() : '';
                var html = child.getHtml ? child.getHtml().trim() : '';
                if (!texto || texto === '' || html === '<br>' || html === '&nbsp;' || html === '') {
                    child.remove();
                } else if (ultimaFolha) {
                    ultimaFolha.append(child);
                }
            }
        }
    }

    /**
     * Renumera data-page="1", "2", ...
     */
    function renumerarPaginas(editor) {
        var doc = editor.document;
        if (!doc) return;
        var folhas = doc.getBody().find('.folha-a4');
        for (var i = 0; i < folhas.count(); i++) {
            var f = folhas.getItem(i);
            f.setAttribute('data-page', (i + 1).toString());
        }
    }

    /**
     * Aplica as margens personalizadas configuradas pelo usuário na folha
     */
    function aplicarMargensPersonalizadas(folha, editor) {
        if (!folha || !editor) return;
        if (editor._a4MargensPadrao) {
            folha.setStyle('padding-top', editor._a4MargensPadrao.top);
            folha.setStyle('padding-bottom', editor._a4MargensPadrao.bottom);
            folha.setStyle('padding-left', editor._a4MargensPadrao.left);
            folha.setStyle('padding-right', editor._a4MargensPadrao.right);
        }
    }

    /**
     * Adiciona manualmente uma nova folha física A4
     */
    function adicionarNovaPaginaManual(editor) {
        if (!editorSuportaA4Pages(editor)) return;
        var doc = editor.document;
        var body = doc.getBody();
        garantirEstruturaA4(editor);

        var folhas = body.find('.folha-a4');
        var proximaPagina = folhas.count() + 1;

        var novaFolha = new CKEDITOR.dom.element('div');
        novaFolha.addClass('folha-a4');
        novaFolha.setAttribute('data-page', proximaPagina);
        aplicarMargensPersonalizadas(novaFolha, editor);

        var novoParagrafo = new CKEDITOR.dom.element('p');
        novoParagrafo.appendBogus();
        novaFolha.append(novoParagrafo);

        body.append(novaFolha);
        renumerarPaginas(editor);

        editor.focus();
        var range = editor.createRange();
        range.moveToPosition(novoParagrafo, CKEDITOR.POSITION_AFTER_START);
        range.select();
        // novaFolha.scrollIntoView();
    }

    /**
     * Verifica se um elemento do CKEditor é considerado vazio
     * (parágrafos vazios, com apenas <br>, &nbsp; ou espaços em branco)
     */
    function isElementoVazio(el) {
        if (!el || el.type !== CKEDITOR.NODE_ELEMENT) return true;
        // Se tiver widgets ou elementos visuais de formulário/mídia, não está vazio
        if (el.find && el.find('.qfield-widget, img, table, iframe, hr, input, select, button').count() > 0) {
            return false;
        }
        var texto = el.getText ? el.getText() : '';
        // Remove espaços não separáveis (&nbsp; = \u00a0) e espaços normais
        texto = texto.replace(/\u00a0/g, ' ').trim();
        return texto === '';
    }

    /**
     * Verifica se uma folha A4 está vazia para fins de remoção automática
     */
    function isFolhaVazia(folha) {
        if (!folha || !folha.find) return true;
        if (folha.find('.qfield-widget, img, table, iframe, hr, input, select, button').count() > 0) {
            return false;
        }
        var texto = folha.getText ? folha.getText() : '';
        texto = texto.replace(/\u00a0/g, ' ').trim();
        if (texto !== '') return false;

        // Se o texto é vazio e não tem widgets, verifica os blocos filhos
        var filhos = folha.getChildren();
        var qtdBlocos = 0;
        for (var i = 0; i < filhos.count(); i++) {
            var item = filhos.getItem(i);
            if (item.type === CKEDITOR.NODE_ELEMENT) {
                qtdBlocos++;
                if (!isElementoVazio(item)) return false;
            }
        }
        // Se tiver 0 ou 1 bloco vazio, é considerada vazia
        return qtdBlocos <= 1;
    }

    /**
     * Obtém a margem inferior interna (padding-bottom) da folha A4
     */
    function obterMargemInferiorInterna(folha) {
        try {
            var el = folha.$;
            var win = folha.getWindow ? folha.getWindow().$ : window;
            var estilo = win.getComputedStyle ? win.getComputedStyle(el) : null;
            if (estilo && estilo.paddingBottom) {
                return parseFloat(estilo.paddingBottom) || 80;
            }
        } catch (e) { }
        return 80; // padrão ~2.5cm
    }

    /**
     * Calcula o espaço livre real em pixels até o início da margem inferior da folha A4
     */
    function obterEspacoLivreNaFolha(folha) {
        if (!folha || !folha.$) return 0;
        var elFolha = folha.$;
        var margemInferior = obterMargemInferiorInterna(folha);
        var limiteInferior = elFolha.clientHeight - margemInferior;

        var ultimoFilho = folha.getLast(function (node) {
            return node.type === CKEDITOR.NODE_ELEMENT;
        });

        if (!ultimoFilho || !ultimoFilho.$) {
            return limiteInferior;
        }

        var rectFolha = elFolha.getBoundingClientRect();
        var rectUltimo = ultimoFilho.$.getBoundingClientRect();
        var alturaOcupada = rectUltimo.bottom - rectFolha.top;

        var livre = limiteInferior - alturaOcupada;
        return livre > 0 ? livre : 0;
    }

    /**
     * Verifica se o conteúdo ou o último elemento ultrapassou a área útil (atingiu a margem inferior da folha A4)
     */
    function folhaUltrapassouLimite(folha, ultimoFilho) {
        if (!folha || !folha.$) return false;
        var margemInferior = obterMargemInferiorInterna(folha);
        var limiteInferior = folha.$.clientHeight - margemInferior;

        if (ultimoFilho && ultimoFilho.$) {
            var rectFolha = folha.$.getBoundingClientRect();
            var rectUltimo = ultimoFilho.$.getBoundingClientRect();
            // Se a base do último elemento ultrapassar o início da margem inferior da página:
            if (rectUltimo.bottom > (rectFolha.top + limiteInferior)) {
                return true;
            }
        }

        if (folha.$.scrollHeight > folha.$.clientHeight + 2) return true;
        return false;
    }

    /**
     * FLUXO CONTÍNUO ESTILO WORD:
     * Transborda elementos excedentes (incluindo parágrafos vazios) para a próxima página,
     * recolhe elementos de volta se houver espaço e gerencia páginas com perfeição.
     */
    function ajustarFluxoPaginas(editor) {
        if (!editorSuportaA4Pages(editor)) return;
        if (emAjuste) return;
        var doc = editor.document;
        if (!doc) return;
        var body = doc.getBody();
        if (!body) return;

        emAjuste = true;

        try {
            var sel = editor.getSelection();
            var bookmarks = null;
            var elAtivo = null;
            var folhaAtiva = null;

            if (sel && sel.getType() !== CKEDITOR.SELECTION_NONE) {
                elAtivo = sel.getStartElement();
                folhaAtiva = obterFolhaAscendente(elAtivo);
                try {
                    bookmarks = sel.createBookmarks2(true);
                } catch (e) { }
            }

            var houveMudanca = false;
            var cursorMovidoParaElemento = null;
            var folhas = body.find('.folha-a4');

            // 1. FLUXO DIRETO (PUSH): Transborda elementos excedentes para a próxima página
            for (var i = 0; i < folhas.count(); i++) {
                var folha = folhas.getItem(i);
                if (!folha || !folha.$) continue;

                var limiteSeguranca = 50; // Proteção contra loop infinito
                while (limiteSeguranca > 0) {
                    // Pega o último elemento de bloco da folha
                    var ultimoFilho = folha.getLast(function (node) {
                        return node.type === CKEDITOR.NODE_ELEMENT;
                    });

                    if (!ultimoFilho) break;

                    // Se não ultrapassou o limite físico da folha, para
                    if (!folhaUltrapassouLimite(folha, ultimoFilho)) break;

                    limiteSeguranca--;

                    // Conta quantos elementos filhos reais existem
                    var filhosElementos = folha.getChildren();
                    var qtdElementos = 0;
                    for (var c = 0; c < filhosElementos.count(); c++) {
                        if (filhosElementos.getItem(c).type === CKEDITOR.NODE_ELEMENT) qtdElementos++;
                    }

                    // Se só houver 1 elemento e ele for maior que a folha, não pode mais mover
                    if (qtdElementos <= 1) break;

                    houveMudanca = true;

                    // Verifica se o cursor do usuário está dentro deste elemento que vai ser movido
                    var cursorNesteElemento = false;
                    if (elAtivo && (elAtivo.equals(ultimoFilho) || ultimoFilho.contains(elAtivo))) {
                        cursorNesteElemento = true;
                    }

                    // Encontra ou cria a próxima folha A4
                    var proximaFolha = folha.getNext(function (node) {
                        return node.hasClass && node.hasClass('folha-a4');
                    });

                    if (!proximaFolha) {
                        proximaFolha = new CKEDITOR.dom.element('div');
                        proximaFolha.addClass('folha-a4');
                        aplicarMargensPersonalizadas(proximaFolha, editor);
                        if (folha && folha.$ && folha.$.parentNode) {
                            proximaFolha.insertAfter(folha);
                        } else {
                            body.append(proximaFolha);
                        }
                        folhas = body.find('.folha-a4'); // Atualiza a lista
                    }

                    // Move o elemento excedente para o topo da próxima página com segurança absoluta
                    proximaFolha.append(ultimoFilho, true);

                    // Se o cursor estava neste elemento, registra para reposicionar na nova folha
                    if (cursorNesteElemento) {
                        cursorMovidoParaElemento = ultimoFilho;
                    }
                }
            }

            // 2. FLUXO REVERSO (PULL): Puxa elementos de volta da próxima página se couberem
            folhas = body.find('.folha-a4');
            for (var p = 0; p < folhas.count() - 1; p++) {
                var folhaAtual = folhas.getItem(p);
                var folhaSeguinte = folhaAtual.getNext(function (node) {
                    return node.hasClass && node.hasClass('folha-a4');
                });
                if (!folhaSeguinte) continue;

                var limitePull = 20;
                while (limitePull > 0) {
                    limitePull--;

                    // Calcula o espaço livre real na folha atual
                    var espacoLivre = obterEspacoLivreNaFolha(folhaAtual);
                    if (espacoLivre < 20) {
                        // Menos de 20px livres: não cabe sequer uma linha simples
                        break;
                    }

                    var primeiroDaSeguinte = folhaSeguinte.getFirst(function (node) {
                        return node.type === CKEDITOR.NODE_ELEMENT;
                    });
                    if (!primeiroDaSeguinte || !primeiroDaSeguinte.$) break;

                    // Mede a altura real do elemento na folha seguinte
                    var rectItem = primeiroDaSeguinte.$.getBoundingClientRect();
                    var alturaItem = rectItem.height || primeiroDaSeguinte.$.offsetHeight || 20;

                    // Se a altura do elemento (mais folga de margem) exceder o espaço livre, não cabe!
                    if (alturaItem + 5 > espacoLivre) {
                        break;
                    }

                    // Se couber perfeitamente:
                    var cursorNoItem = false;
                    if (elAtivo && (elAtivo.equals(primeiroDaSeguinte) || primeiroDaSeguinte.contains(elAtivo))) {
                        cursorNoItem = true;
                    }

                    // Move para a folha atual
                    folhaAtual.append(primeiroDaSeguinte);
                    houveMudanca = true;

                    if (cursorNoItem) {
                        cursorMovidoParaElemento = primeiroDaSeguinte;
                    }
                }
            }

            // 3. LIMPEZA DE PÁGINAS VAZIAS SUBSEQUENTES:
            // Remove folhas que ficaram totalmente sem nenhum bloco
            folhas = body.find('.folha-a4');
            for (var j = folhas.count() - 1; j > 0; j--) {
                var f = folhas.getItem(j);

                // NUNCA remova a folha ativa onde o usuário está
                if (folhaAtiva && folhaAtiva.equals(f)) continue;

                // Conta quantos blocos existem dentro da folha
                var qtdFilhosBlocos = 0;
                var ch = f.getChildren();
                for (var b = 0; b < ch.count(); b++) {
                    if (ch.getItem(b).type === CKEDITOR.NODE_ELEMENT) qtdFilhosBlocos++;
                }

                // Se a folha ficou com 0 blocos (todos subiram para a folha anterior):
                if (qtdFilhosBlocos === 0) {
                    f.remove();
                    houveMudanca = true;
                }
            }

            if (houveMudanca) {
                renumerarPaginas(editor);

                if (cursorMovidoParaElemento) {
                    try {
                        var r = editor.createRange();
                        r.moveToElementEditEnd(cursorMovidoParaElemento);
                        r.select();
                        // cursorMovidoParaElemento.scrollIntoView();
                    } catch (e) { }
                } else if (bookmarks) {
                    try {
                        editor.getSelection().selectBookmarks(bookmarks);
                    } catch (e) { }
                }
            }
        } catch (err) {
            // Falha silenciosa para não interromper a digitação
        } finally {
            emAjuste = false;
        }
    }

    /**
     * Debounce para o ajuste de fluxo não pesar durante digitação rápida
     */
    function dispararAjusteDebounced(editor, delay) {
        if (timerAjuste) clearTimeout(timerAjuste);
        timerAjuste = setTimeout(function () {
            ajustarFluxoPaginas(editor);
        }, delay || 50);
    }

    /**
     * Instala as travas de teclado e foco
     */
    function instalarTravas(editor) {
        if (!editorSuportaA4Pages(editor)) return;
        var doc = editor.document;
        if (!doc) return;

        // 1. Trava de Seleção: Mantém o cursor sempre dentro de uma folha
        editor.on('selectionChange', function (evt) {
            if (emAjuste) return;

            var sel = evt.data.selection;
            if (!sel) return;

            var startEl = sel.getStartElement();
            if (!startEl) return;

            var folha = obterFolhaAscendente(startEl);
            if (!folha) {
                var body = doc.getBody();
                var folhas = body.find('.folha-a4');
                if (folhas.count() > 0) {
                    var ultimaFolha = folhas.getItem(folhas.count() - 1);
                    var range = editor.createRange();
                    range.moveToPosition(ultimaFolha, CKEDITOR.POSITION_BEFORE_END);
                    range.select();
                }
            }
        });

        // 2. Trava de Teclado
        editor.on('key', function (evt) {
            var keyCode = evt.data.keyCode;
            var sel = editor.getSelection();
            if (!sel) return;

            var startEl = sel.getStartElement();
            var folha = obterFolhaAscendente(startEl);

            // Bloqueia qualquer tecla fora das folhas
            if (!folha) {
                evt.cancel();
                garantirEstruturaA4(editor);
                return;
            }

            // Backspace (8)
            if (keyCode === 8) {
                var ranges = sel.getRanges();
                if (ranges && ranges.length > 0) {
                    var range = ranges[0];
                    if (range && range.collapsed) {
                        // Verifica se está no início do bloco atual
                        var noInicioDoBloco = false;
                        try {
                            noInicioDoBloco = range.checkStartOfBlock();
                        } catch (e) { }

                        if (noInicioDoBloco) {
                            var path = range.startPath();
                            var blocoAtual = path ? path.block : null;
                            var primeiroBloco = folha.getFirst(function (n) {
                                return n.type === CKEDITOR.NODE_ELEMENT;
                            });

                            // Se estiver no primeiro bloco da folha e no início dele
                            if (blocoAtual && primeiroBloco && (blocoAtual.equals(primeiroBloco) || primeiroBloco.contains(blocoAtual))) {
                                var folhaAnterior = folha.getPrevious(function (node) {
                                    return node.hasClass && node.hasClass('folha-a4');
                                });

                                if (!folhaAnterior) {
                                    // Na Página 1, no início absoluto: cancela o backspace para não sair da folha
                                    evt.cancel();
                                    return;
                                }

                                // Na Página 2 ou posterior:
                                var ch = folha.getChildren();
                                var qtdBlocos = 0;
                                for (var k = 0; k < ch.count(); k++) {
                                    if (ch.getItem(k).type === CKEDITOR.NODE_ELEMENT) qtdBlocos++;
                                }

                                // Se a folha atual só tem esse parágrafo e ele está vazio:
                                if (qtdBlocos <= 1 && isElementoVazio(blocoAtual)) {
                                    evt.cancel();
                                    folha.remove();
                                    renumerarPaginas(editor);

                                    // Move o cursor para o final da folha anterior
                                    var ultimoBlocoAnt = folhaAnterior.getLast(function (n) {
                                        return n.type === CKEDITOR.NODE_ELEMENT;
                                    });
                                    var rFim = editor.createRange();
                                    if (ultimoBlocoAnt) {
                                        rFim.moveToElementEditEnd(ultimoBlocoAnt);
                                    } else {
                                        rFim.moveToPosition(folhaAnterior, CKEDITOR.POSITION_BEFORE_END);
                                    }
                                    rFim.select();
                                    // folhaAnterior.scrollIntoView();
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            // Se for Enter (13), dispara ajuste mais rápido para resposta imediata
            if (keyCode === 13) {
                setTimeout(function () {
                    ajustarFluxoPaginas(editor);
                }, 20);
            } else {
                // Outras teclas disparam com debounce normal
                dispararAjusteDebounced(editor, 60);
            }

        }, null, null, 1);

        // Dispara ajuste contínuo em eventos de mudança (colar, cortar, desfazer, etc.)
        editor.on('change', function () {
            moverNosOrfaosParaFolhas(editor);
            dispararAjusteDebounced(editor, 60);
        });

        // 3. Clique no espaço cinza fora das folhas: redireciona para a folha mais próxima
        doc.getBody().on('click', function (evt) {
            var target = evt.data.getTarget();
            var folha = obterFolhaAscendente(target);
            if (!folha) {
                moverNosOrfaosParaFolhas(editor);
                var folhas = doc.getBody().find('.folha-a4');
                if (folhas.count() > 0) {
                    var ultima = folhas.getItem(folhas.count() - 1);
                    var range = editor.createRange();
                    range.moveToPosition(ultima, CKEDITOR.POSITION_BEFORE_END);
                    range.select();
                }
            }
        });
    }

})();

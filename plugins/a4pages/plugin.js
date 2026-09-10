/**
 * Plugin a4pages para CKEditor 4
 * Gerencia documentos divididos em páginas físicas A4 (div.folha-a4)
 * sem uso de Widget, com trava estrita para não permitir escrita fora das folhas.
 */
(function () {
    'use strict';

    CKEDITOR.plugins.add('a4pages', {
        icons: 'a4page',

        init: function (editor) {
            // Comando para adicionar nova página A4
            editor.addCommand('addA4Page', {
                exec: function (editor) {
                    adicionarNovaPagina(editor);
                }
            });

            // Comando para remover a página atual (se houver mais de 1)
            editor.addCommand('removeA4Page', {
                exec: function (editor) {
                    removerPaginaAtual(editor);
                }
            });

            // Botão na barra de ferramentas
            if (editor.ui.addButton) {
                editor.ui.addButton('AddA4Page', {
                    label: 'Adicionar Nova Página A4',
                    command: 'addA4Page',
                    toolbar: 'document,50',
                    icon: this.path + 'icons/a4page.png'
                });
            }

            // Garante que o documento tenha pelo menos 1 folha A4 e impede escrita fora
            editor.on('instanceReady', function () {
                garantirEstruturaA4(editor);
                instalarTravas(editor);
            });

            // Re-verifica estrutura sempre que novo conteúdo for carregado (setData)
            editor.on('setData', function () {
                setTimeout(function () {
                    garantirEstruturaA4(editor);
                }, 50);
            });
        }
    });

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
        var doc = editor.document;
        if (!doc) return;

        var body = doc.getBody();
        if (!body) return;

        var folhas = body.find('.folha-a4');

        // Se não houver nenhuma folha, envolve todo o conteúdo do body na Página 1
        if (folhas.count() === 0) {
            var htmlExistente = body.getHtml().trim();
            if (!htmlExistente || htmlExistente === '<p><br></p>' || htmlExistente === '<p>&nbsp;</p>') {
                htmlExistente = '<p><br></p>';
            }
            body.setHtml('<div class="folha-a4" data-page="1">' + htmlExistente + '</div>');
        } else {
            // Se houver nós órfãos soltos fora das folhas (direto no body), move para a folha mais próxima
            moverNosOrfaosParaFolhas(editor);
            renumerarPaginas(editor);
        }
    }

    /**
     * Move qualquer elemento/texto que esteja solto fora das folhas para dentro da folha mais próxima
     */
    function moverNosOrfaosParaFolhas(editor) {
        var body = editor.document.getBody();
        var children = body.getChildren();
        var ultimaFolha = null;

        for (var i = 0; i < children.count(); i++) {
            var child = children.getItem(i);
            if (child.hasClass && child.hasClass('folha-a4')) {
                ultimaFolha = child;
            } else if (child.getName && child.getName() !== 'script' && child.getName() !== 'style') {
                // Se for um nó órfão fora da folha
                if (ultimaFolha) {
                    child.move(ultimaFolha, false); // Move para o final da última folha
                }
            }
        }
    }

    /**
     * Adiciona uma nova folha A4 no final do documento
     */
    function adicionarNovaPagina(editor) {
        var doc = editor.document;
        var body = doc.getBody();
        garantirEstruturaA4(editor);

        var folhas = body.find('.folha-a4');
        var proximaPagina = folhas.count() + 1;

        var novaFolha = new CKEDITOR.dom.element('div');
        novaFolha.addClass('folha-a4');
        novaFolha.setAttribute('data-page', proximaPagina);

        var novoParagrafo = new CKEDITOR.dom.element('p');
        novoParagrafo.appendBogus();
        novaFolha.append(novoParagrafo);

        body.append(novaFolha);
        renumerarPaginas(editor);

        // Posiciona o cursor no novo parágrafo da nova página
        editor.focus();
        var range = editor.createRange();
        range.moveToPosition(novoParagrafo, CKEDITOR.POSITION_AFTER_START);
        range.select();

        // Rola suavemente até a nova folha
        novaFolha.scrollIntoView();
    }

    /**
     * Remove a folha A4 onde o cursor está posicionado (desde que não seja a única)
     */
    function removerPaginaAtual(editor) {
        var sel = editor.getSelection();
        if (!sel) return;

        var el = sel.getStartElement();
        var folha = obterFolhaAscendente(el);
        if (!folha) return;

        var doc = editor.document;
        var folhas = doc.getBody().find('.folha-a4');
        if (folhas.count() <= 1) {
            alert('Não é possível remover a única página do documento.');
            return;
        }

        if (confirm('Tem certeza de que deseja excluir esta página (Página ' + (folha.getAttribute('data-page') || '') + ')?')) {
            var folhaAnterior = folha.getPrevious(function (node) {
                return node.hasClass && node.hasClass('folha-a4');
            }) || folha.getNext(function (node) {
                return node.hasClass && node.hasClass('folha-a4');
            });

            folha.remove();
            renumerarPaginas(editor);

            if (folhaAnterior) {
                var range = editor.createRange();
                range.moveToPosition(folhaAnterior, CKEDITOR.POSITION_BEFORE_END);
                range.select();
                folhaAnterior.scrollIntoView();
            }
        }
    }

    /**
     * Atualiza sequencialmente os atributos data-page="1", "2", ...
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
     * Instala as travas de teclado, seleção e clique para impedir digitação ou cursor fora de .folha-a4
     */
    function instalarTravas(editor) {
        var doc = editor.document;
        if (!doc) return;

        // 1. Trava de Seleção: Se o cursor for colocado fora de qualquer folha, puxa para dentro da folha
        editor.on('selectionChange', function (evt) {
            var sel = evt.data.selection;
            if (!sel) return;

            var startEl = sel.getStartElement();
            if (!startEl) return;

            var folha = obterFolhaAscendente(startEl);
            if (!folha) {
                // Está fora de qualquer folha (no body cinza da mesa)
                var body = doc.getBody();
                var folhas = body.find('.folha-a4');
                if (folhas.count() > 0) {
                    var primeiraFolha = folhas.getItem(0);
                    var range = editor.createRange();
                    range.moveToPosition(primeiraFolha, CKEDITOR.POSITION_AFTER_START);
                    range.select();
                }
            }
        });

        // 2. Trava de Teclado: Bloqueia digitação fora da folha e impede apagar a própria div .folha-a4 com Backspace/Delete
        editor.on('key', function (evt) {
            var keyCode = evt.data.keyCode;
            var sel = editor.getSelection();
            if (!sel) return;

            var startEl = sel.getStartElement();
            var folha = obterFolhaAscendente(startEl);

            // Se por qualquer razão não estiver dentro de uma folha, CANCELA qualquer tecla!
            if (!folha) {
                evt.cancel();
                garantirEstruturaA4(editor);
                return;
            }

            // Trava contra Backspace (8) no início da folha para não destruir o contêiner
            if (keyCode === 8) {
                var range = sel.getRanges()[0];
                if (range && range.collapsed) {
                    // Verifica se está no início absoluto da folha
                    var testRange = range.clone();
                    testRange.moveToPosition(folha, CKEDITOR.POSITION_AFTER_START);
                    if (range.compareBoundaryPoints(CKEDITOR.START_TO_START, testRange) === 0) {
                        // Está no início exato da folha! Bloqueia o Backspace para não mesclar com folha anterior nem apagar div
                        evt.cancel();
                        return;
                    }
                }
            }

            // Trava contra Delete (46) no final da folha para não puxar a próxima folha
            if (keyCode === 46) {
                var rangeDel = sel.getRanges()[0];
                if (rangeDel && rangeDel.collapsed) {
                    var testRangeDel = rangeDel.clone();
                    testRangeDel.moveToPosition(folha, CKEDITOR.POSITION_BEFORE_END);
                    if (rangeDel.compareBoundaryPoints(CKEDITOR.END_TO_END, testRangeDel) === 0) {
                        // Está no fim exato da folha! Bloqueia Delete para não mesclar
                        evt.cancel();
                        return;
                    }
                }
            }

            // Trava para Enter (13): Garante que novo parágrafo NUNCA escape para fora da .folha-a4
            if (keyCode === 13) {
                // Se a folha já atingiu ou excedeu a capacidade máxima de 29.7cm, impede criar novas linhas
                if (folha.$ && folha.$.scrollHeight > folha.$.clientHeight) {
                    evt.cancel();
                    folha.addClass('folha-cheia');
                    return;
                }

                var rangeEnter = sel.getRanges()[0];
                if (rangeEnter && rangeEnter.collapsed) {
                    var endCheck = rangeEnter.clone();
                    endCheck.moveToPosition(folha, CKEDITOR.POSITION_BEFORE_END);
                    if (rangeEnter.compareBoundaryPoints(CKEDITOR.END_TO_END, endCheck) === 0) {
                        evt.cancel();
                        var novoP = new CKEDITOR.dom.element('p');
                        novoP.appendBogus();
                        folha.append(novoP);
                        var newR = editor.createRange();
                        newR.moveToPosition(novoP, CKEDITOR.POSITION_AFTER_START);
                        newR.select();
                        novoP.scrollIntoView();
                        return;
                    }
                }
            }
        }, null, null, 1); // Prioridade 1 (executa antes dos comandos normais)

        // Monitora mudanças para limpar nós órfãos e sinalizar se alguma folha transbordou
        editor.on('change', function () {
            limparNosOrfaos(editor);
            verificarCapacidadeFolhas(editor);
        });

        // 3. Clique direto no body cinza da mesa de trabalho
        doc.getBody().on('click', function (evt) {
            var target = evt.data.getTarget();
            var folha = obterFolhaAscendente(target);
            if (!folha) {
                // Clicou fora: foca no final da folha mais próxima
                limparNosOrfaos(editor);
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

    /**
     * Remove parágrafos vazios que tentem ser criados no body fora de .folha-a4
     */
    function limparNosOrfaos(editor) {
        var doc = editor.document;
        if (!doc) return;
        var body = doc.getBody();
        if (!body) return;
        var children = body.getChildren();
        var ultimaFolha = null;

        for (var i = children.count() - 1; i >= 0; i--) {
            var child = children.getItem(i);
            if (child.hasClass && child.hasClass('folha-a4')) {
                ultimaFolha = child;
            } else if (child.getName && child.getName() !== 'script' && child.getName() !== 'style') {
                var texto = child.getText ? child.getText().trim() : '';
                var html = child.getHtml ? child.getHtml().trim() : '';
                if (!texto || texto === '' || html === '<br>' || html === '&nbsp;' || html === '') {
                    child.remove();
                } else if (ultimaFolha) {
                    child.move(ultimaFolha, false);
                }
            }
        }
    }

    /**
     * Verifica todas as folhas A4 e marca com .folha-cheia caso o conteúdo exceda a altura fixa de 29.7cm
     */
    function verificarCapacidadeFolhas(editor) {
        var doc = editor.document;
        if (!doc) return;
        var body = doc.getBody();
        if (!body) return;
        var folhas = body.find('.folha-a4');

        for (var i = 0; i < folhas.count(); i++) {
            var f = folhas.getItem(i);
            if (f.$) {
                // Se o scrollHeight for maior que o clientHeight (altura visível fixa)
                if (f.$.scrollHeight > f.$.clientHeight + 2) {
                    f.addClass('folha-cheia');
                } else {
                    f.removeClass('folha-cheia');
                }
            }
        }
    }

})();

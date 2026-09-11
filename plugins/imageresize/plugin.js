/**
 * Plugin imageresize para CKEditor 4
 * Permite redimensionamento interativo de imagens com alças visuais (drag-to-resize),
 * preservação de proporção (aspect ratio), badge de dimensões em tempo real,
 * integração nativa com diálogo de propriedades por duplo clique e suporte a Undo/Redo.
 */
(function () {
    'use strict';

    CKEDITOR.plugins.add('imageresize', {
        init: function (editor) {
            var cssPath = this.path + 'styles/imageresize.css';

            // Registra estilo para ser injetado no iframe do editor
            if (editor.addContentsCss) {
                editor.addContentsCss(cssPath);
            }

            var inicializado = false;

            function carregar() {
                if (inicializado) return;
                if (editor.document) {
                    inicializado = true;
                    try {
                        editor.document.appendStyleSheet(cssPath);
                    } catch (e) { }
                    iniciarRedimensionador(editor);
                }
            }

            editor.on('contentDom', carregar);
            editor.on('instanceReady', carregar);
        }
    });

    function iniciarRedimensionador(editor) {
        var editorWin = editor.window.$;
        var editorDoc = editor.document.$;
        var activeImage = null;
        var wrapper = null;
        var tooltip = null;
        var currentContainer = null;
        var isDragging = false;
        var dragData = {};
        var resizeObserver = null;

        // Determina o melhor elemento contêiner (a folha A4 mais próxima ou o body)
        function obterContainerPai(img) {
            if (!img) return editorDoc.body;
            var p = img.parentElement;
            while (p && p !== editorDoc.body) {
                if (p.classList && p.classList.contains('folha-a4')) {
                    return p;
                }
                p = p.parentElement;
            }
            if (editorDoc.body && editorWin.getComputedStyle(editorDoc.body).position === 'static') {
                editorDoc.body.style.position = 'relative';
            }
            return editorDoc.body;
        }

        // Cria a estrutura visual do redimensionador (overlay com alças e tooltip de dimensões)
        function criarEstrutura(container) {
            if (wrapper && wrapper.parentNode === container) {
                return;
            }

            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
                wrapper = null;
            }

            currentContainer = container || editorDoc.body;

            wrapper = editorDoc.createElement('div');
            wrapper.className = 'cke-image-resizer-wrapper';
            wrapper.setAttribute('data-cke-temp', '1');
            wrapper.setAttribute('contenteditable', 'false');

            // 8 alças direcionais
            var direcoes = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
            for (var i = 0; i < direcoes.length; i++) {
                var dir = direcoes[i];
                var handle = editorDoc.createElement('div');
                handle.className = 'cke-image-resizer-handle handle-' + dir;
                handle.setAttribute('data-direction', dir);
                handle.setAttribute('data-cke-temp', '1');
                wrapper.appendChild(handle);
            }

            // Badge/Tooltip de dimensões
            tooltip = editorDoc.createElement('div');
            tooltip.className = 'cke-image-resizer-tooltip';
            tooltip.setAttribute('data-cke-temp', '1');
            wrapper.appendChild(tooltip);

            currentContainer.appendChild(wrapper);

            // Vincula evento de mousedown nas alças para iniciar redimensionamento
            wrapper.addEventListener('mousedown', function (e) {
                var target = e.target;
                if (target && target.classList.contains('cke-image-resizer-handle')) {
                    iniciarArraste(e, target.getAttribute('data-direction'));
                }
            });
        }

        // Obtém coordenadas exatas relativas ao container pai
        function obterCoordenadasElemento(el, container) {
            var rect = el.getBoundingClientRect();
            var containerRect = (container || editorDoc.body).getBoundingClientRect();

            return {
                top: rect.top - containerRect.top,
                left: rect.left - containerRect.left,
                width: rect.width,
                height: rect.height
            };
        }

        // Atualiza a posição e exibição do wrapper sobre a imagem ativa
        function atualizarPosicao() {
            if (!activeImage || !wrapper || !currentContainer) return;

            // Se a imagem não estiver mais conectada ao DOM, esconde o resizer
            if (!activeImage.parentNode || !editorDoc.contains(activeImage)) {
                ocultar();
                return;
            }

            var coords = obterCoordenadasElemento(activeImage, currentContainer);
            wrapper.style.top = coords.top + 'px';
            wrapper.style.left = coords.left + 'px';
            wrapper.style.width = coords.width + 'px';
            wrapper.style.height = coords.height + 'px';
            wrapper.style.display = 'block';

            // Atualiza o texto do tooltip com dimensões atuais
            var largura = Math.round(coords.width);
            var altura = Math.round(coords.height);
            tooltip.textContent = largura + ' × ' + altura + ' px';
        }

        // Exibe o redimensionador para a imagem fornecida
        function exibirParaImagem(img) {
            if (!img || img.nodeName.toLowerCase() !== 'img') return;

            // Se houver seleção de texto ampla (arraste de mouse ou Ctrl+A), não ativa o resizer
            var winSel = editorWin.getSelection ? editorWin.getSelection() : null;
            if (winSel && !winSel.isCollapsed && winSel.toString().trim().length > 0) {
                ocultar();
                return;
            }

            if (activeImage && activeImage !== img) {
                activeImage.classList.remove('cke-image-resizing');
            }

            activeImage = img;
            activeImage.classList.add('cke-image-resizing');

            var container = obterContainerPai(img);
            criarEstrutura(container);
            atualizarPosicao();

            // Limpa qualquer seleção nativa de texto para remover a película azul da imagem clicada
            try {
                if (winSel && winSel.removeAllRanges) {
                    winSel.removeAllRanges();
                }
            } catch (e) { }

            // Observador de redimensionamento na imagem
            if (window.ResizeObserver && !resizeObserver) {
                try {
                    resizeObserver = new ResizeObserver(function () {
                        if (!isDragging) {
                            atualizarPosicao();
                        }
                    });
                } catch (e) { }
            }
            if (resizeObserver) {
                try {
                    resizeObserver.observe(img);
                } catch (e) { }
            }
        }

        // Oculta o redimensionador
        function ocultar() {
            if (isDragging) return;
            if (activeImage) {
                activeImage.classList.remove('cke-image-resizing');
            }
            if (resizeObserver && activeImage) {
                try {
                    resizeObserver.unobserve(activeImage);
                } catch (e) { }
            }
            activeImage = null;
            if (wrapper) {
                wrapper.style.display = 'none';
            }
        }

        // Inicia o processo de arraste (drag-to-resize)
        function iniciarArraste(e, direction) {
            if (!activeImage) return;

            e.preventDefault();
            e.stopPropagation();

            isDragging = true;

            var rect = activeImage.getBoundingClientRect();
            var startWidth = rect.width;
            var startHeight = rect.height;
            var aspectRatio = startWidth / (startHeight || 1);

            // Usamos screenX e screenY para perfeita coerência entre iframe e janela externa
            dragData = {
                direction: direction,
                startWidth: startWidth,
                startHeight: startHeight,
                startScreenX: e.screenX,
                startScreenY: e.screenY,
                aspectRatio: aspectRatio
            };

            // Adiciona classe de alça ativa
            var handleEl = wrapper.querySelector('.handle-' + direction);
            if (handleEl) handleEl.classList.add('active');

            // Adiciona listeners globais
            var parentDoc = window.document;
            editorDoc.addEventListener('mousemove', onMouseMove, true);
            editorDoc.addEventListener('mouseup', onMouseUp, true);
            if (parentDoc !== editorDoc) {
                parentDoc.addEventListener('mousemove', onMouseMove, true);
                parentDoc.addEventListener('mouseup', onMouseUp, true);
            }
        }

        function onMouseMove(e) {
            if (!isDragging || !activeImage) return;

            e.preventDefault();

            var deltaX = e.screenX - dragData.startScreenX;
            var deltaY = e.screenY - dragData.startScreenY;
            var dir = dragData.direction;
            var newWidth = dragData.startWidth;
            var newHeight = dragData.startHeight;
            var preserveAspect = !e.shiftKey; // Mantém proporção nos cantos, a menos que Shift seja pressionado

            // Alças de cantos com resposta suave em qualquer direção do mouse
            if (dir === 'se') {
                if (preserveAspect) {
                    var ratioDelta = (deltaX + deltaY * dragData.aspectRatio) / 2;
                    newWidth = dragData.startWidth + ratioDelta;
                    newHeight = newWidth / dragData.aspectRatio;
                } else {
                    newWidth = dragData.startWidth + deltaX;
                    newHeight = dragData.startHeight + deltaY;
                }
            } else if (dir === 'sw') {
                if (preserveAspect) {
                    var ratioDelta = (-deltaX + deltaY * dragData.aspectRatio) / 2;
                    newWidth = dragData.startWidth + ratioDelta;
                    newHeight = newWidth / dragData.aspectRatio;
                } else {
                    newWidth = dragData.startWidth - deltaX;
                    newHeight = dragData.startHeight + deltaY;
                }
            } else if (dir === 'ne') {
                if (preserveAspect) {
                    var ratioDelta = (deltaX - deltaY * dragData.aspectRatio) / 2;
                    newWidth = dragData.startWidth + ratioDelta;
                    newHeight = newWidth / dragData.aspectRatio;
                } else {
                    newWidth = dragData.startWidth + deltaX;
                    newHeight = dragData.startHeight - deltaY;
                }
            } else if (dir === 'nw') {
                if (preserveAspect) {
                    var ratioDelta = (-deltaX - deltaY * dragData.aspectRatio) / 2;
                    newWidth = dragData.startWidth + ratioDelta;
                    newHeight = newWidth / dragData.aspectRatio;
                } else {
                    newWidth = dragData.startWidth - deltaX;
                    newHeight = dragData.startHeight - deltaY;
                }
            }
            // Alças laterais (apenas largura)
            else if (dir === 'e') {
                newWidth = dragData.startWidth + deltaX;
            } else if (dir === 'w') {
                newWidth = dragData.startWidth - deltaX;
            }
            // Alças superior/inferior (apenas altura)
            else if (dir === 's') {
                newHeight = dragData.startHeight + deltaY;
            } else if (dir === 'n') {
                newHeight = dragData.startHeight - deltaY;
            }

            // Impõe limite mínimo de 20px
            newWidth = Math.max(20, Math.round(newWidth));
            newHeight = Math.max(20, Math.round(newHeight));

            // Aplica os novos valores na imagem em tempo real
            activeImage.style.width = newWidth + 'px';
            activeImage.style.height = newHeight + 'px';
            activeImage.setAttribute('width', newWidth);
            activeImage.setAttribute('height', newHeight);

            // Atualiza caixa delimitadora e badge
            atualizarPosicao();
        }

        function onMouseUp(e) {
            if (!isDragging) return;

            isDragging = false;

            // Remove listeners globais
            var parentDoc = window.document;
            editorDoc.removeEventListener('mousemove', onMouseMove, true);
            editorDoc.removeEventListener('mouseup', onMouseUp, true);
            if (parentDoc !== editorDoc) {
                parentDoc.removeEventListener('mousemove', onMouseMove, true);
                parentDoc.removeEventListener('mouseup', onMouseUp, true);
            }

            // Remove classes ativas das alças
            var handles = wrapper.querySelectorAll('.cke-image-resizer-handle');
            for (var h = 0; h < handles.length; h++) {
                handles[h].classList.remove('active');
            }

            atualizarPosicao();

            // Salva snapshot para Undo/Redo no CKEditor
            editor.fire('change');
            editor.fire('saveSnapshot');
        }

        // Abre o diálogo nativo de imagem perfeitamente integrado com a imagem selecionada
        function abrirDialogoImagem(img) {
            if (!img) return;

            var targetImg = img;
            var domImg = new CKEDITOR.dom.element(targetImg);

            // 1. Foca o editor e seleciona explicitamente a imagem
            try {
                editor.focus();
                var sel = editor.getSelection();
                if (sel && sel.selectElement) {
                    sel.selectElement(domImg);
                }
            } catch (err) { }

            // 2. Dispara o comando nativo de imagem do CKEditor
            if (editor.commands && editor.commands.image) {
                editor.execCommand('image');
            } else {
                editor.openDialog('image');
            }

            // 3. Ao confirmar as alterações no diálogo, reposiciona e atualiza o resizer
            var dialog = CKEDITOR.dialog.getCurrent();
            if (dialog) {
                dialog.once('ok', function () {
                    setTimeout(function () {
                        if (activeImage) {
                            atualizarPosicao();
                        }
                    }, 100);
                });
            }
        }

        // Intercepta a abertura do diálogo de imagem para sempre garantir o carregamento dos dados da imagem ativa
        editor.on('dialogShow', function (ev) {
            var dialog = ev.data;
            if (dialog && dialog.getName() === 'image' && activeImage) {
                var domImg = new CKEDITOR.dom.element(activeImage);
                dialog.imageEditMode = 'img';
                dialog.cleanImageElement = domImg;
                dialog.imageElement = domImg.clone(true, true);
                try {
                    dialog.setupContent(1, dialog.imageElement);
                } catch (e) { }

                dialog.once('ok', function () {
                    setTimeout(function () {
                        if (activeImage) {
                            atualizarPosicao();
                        }
                    }, 100);
                });
            }
        });

        // Trata clique em imagens no documento do editor
        function tratarInteracaoImagem(e) {
            var target = e.target;
            if (target && target.nodeName.toLowerCase() === 'img') {
                // Se o usuário estiver selecionando texto com mouse drag, não ativa o redimensionador
                var winSel = editorWin.getSelection ? editorWin.getSelection() : null;
                if (winSel && !winSel.isCollapsed && winSel.toString().trim().length > 0) {
                    ocultar();
                    return;
                }
                exibirParaImagem(target);
            } else if (wrapper && !wrapper.contains(target)) {
                ocultar();
            }
        }

        editorDoc.addEventListener('click', tratarInteracaoImagem, false);

        // Duplo clique na imagem abre diretamente as propriedades da imagem no diálogo nativo
        editorDoc.addEventListener('dblclick', function (e) {
            var target = e.target;
            if (target && target.nodeName.toLowerCase() === 'img') {
                e.preventDefault();
                e.stopPropagation();
                abrirDialogoImagem(target);
            }
        }, true);

        // Detecta seleção através do cursor do CKEditor
        editor.on('selectionChange', function (evt) {
            if (isDragging) return;

            try {
                var sel = editor.getSelection();
                if (!sel) return;

                // Se for seleção de texto (arraste do mouse pelo texto ou Ctrl+A)
                if (sel.getType() === CKEDITOR.SELECTION_TEXT) {
                    ocultar();
                    return;
                }

                // Se houver texto selecionado nativamente no navegador
                var winSel = editorWin.getSelection ? editorWin.getSelection() : null;
                if (winSel && !winSel.isCollapsed && winSel.toString().trim().length > 0) {
                    ocultar();
                    return;
                }

                var selectedEl = sel.getSelectedElement();
                if (selectedEl && selectedEl.$.nodeName.toLowerCase() === 'img') {
                    exibirParaImagem(selectedEl.$);
                } else {
                    var startEl = sel.getStartElement();
                    if (startEl && startEl.$.nodeName.toLowerCase() === 'img' && sel.getType() !== CKEDITOR.SELECTION_TEXT) {
                        exibirParaImagem(startEl.$);
                    } else {
                        ocultar();
                    }
                }
            } catch (err) { }
        });

        // Reposiciona em scroll do editor ou janela
        editorWin.addEventListener('scroll', atualizarPosicao, true);
        editorWin.addEventListener('resize', atualizarPosicao, true);
        window.addEventListener('resize', atualizarPosicao, true);

        // Tecla ESC para cancelar / desselecionar
        editorDoc.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                ocultar();
            }
        });

        // Limpeza ao desmontar ou alternar para modo código-fonte
        editor.on('beforeModeUnload', function () {
            ocultar();
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
                wrapper = null;
            }
        });

        // Não oculta se um diálogo estiver aberto ou recebendo foco
        editor.on('blur', function () {
            if (isDragging) return;
            if (CKEDITOR.dialog.getCurrent()) return;

            setTimeout(function () {
                if (CKEDITOR.dialog.getCurrent()) return;
                var activeEl = editorDoc.activeElement;
                if (!activeEl || (activeEl.nodeName.toLowerCase() !== 'img' && (!wrapper || !wrapper.contains(activeEl)))) {
                    ocultar();
                }
            }, 150);
        });

        // Garante que o HTML exportado (getData) nunca contenha resíduos do resizer
        editor.on('getData', function (evt) {
            if (evt.data && evt.data.dataValue) {
                evt.data.dataValue = evt.data.dataValue
                    .replace(/<div[^>]*class="[^"]*cke-image-resizer-wrapper[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                    .replace(/\bcke-image-resizing\b/g, '');
            }
        });
    }
})();

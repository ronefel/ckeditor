/**
 * Campo de Assinatura (Signature Field)
 * Encapsula:
 * 1. Estilos CSS específicos (canvas, overlays, toolbar, linha de assinatura, botões).
 * 2. Renderização do DOM para os modos "A Punho" (Canvas interativo) e "Upload" (Imagem).
 * 3. Comportamentos de desenho (PointerEvents, alta resolução Retina/DPR, limpar).
 * 4. Upload de arquivo com conversão para Base64 e preview instantâneo.
 * 5. Redimensionamento interativo de imagem (alça de arrasto no canto inferior direito).
 */
var SignatureField = (function () {
    'use strict';

    function render(campo, options) {
        options = options || {};
        var name = campo.getAttribute('data-qfield-name') || 'campo';
        var label = campo.getAttribute('data-qfield-label') || '';
        var width = campo.getAttribute('data-qfield-width') || 'auto';
        var height = campo.getAttribute('data-qfield-height') || 'auto';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';
        var placeholder = campo.getAttribute('data-qfield-placeholder') || '';
        var sigMode = campo.getAttribute('data-qfield-sigmode') || 'draw';

        var values = options.values || options.answers || {};
        var rawValue = (values && values[name] !== undefined) ? values[name] : null;
        var sigVal = '';
        var sigWidth = '';

        if (rawValue && typeof rawValue === 'object') {
            sigVal = rawValue.src || rawValue.image || rawValue.url || rawValue.data || '';
            sigWidth = rawValue.width || '';
        } else if (typeof rawValue === 'string' && rawValue.trim().indexOf('{') === 0) {
            try {
                var parsed = JSON.parse(rawValue);
                sigVal = parsed.src || parsed.image || parsed.url || parsed.data || '';
                sigWidth = parsed.width || '';
            } catch (e) {
                sigVal = rawValue;
            }
        } else if (rawValue !== null && rawValue !== undefined) {
            sigVal = String(rawValue);
        }

        // Também verifica se veio companion value para largura (ex: name + '__width' ou name + '_width')
        if (!sigWidth && values) {
            if (values[name + '__width']) sigWidth = String(values[name + '__width']);
            else if (values[name + '_width']) sigWidth = String(values[name + '_width']);
        }

        var sigLabelText = label || placeholder || '';

        // Modo somente leitura / documento final
        if (options.readOnly) {
            var sigContainerRO = document.createElement('span');
            sigContainerRO.className = 'qform-signature-wrapper qform-sig-answer-wrapper';
            if (width && width !== 'auto') sigContainerRO.style.width = width;

            var answerBox = document.createElement('span');
            answerBox.className = 'qform-sig-answer-box';
            if (height && height !== 'auto') answerBox.style.height = height;

            if (sigMode === 'draw') {
                sigContainerRO.classList.add('qform-sig-answer-draw-wrapper');
                answerBox.classList.add('qform-sig-answer-draw-box');

                if (sigVal) {
                    var imgRO = document.createElement('img');
                    imgRO.className = 'qform-sig-answer-img qform-sig-draw-img';
                    imgRO.src = sigVal;
                    imgRO.alt = sigLabelText || 'Assinatura';
                    answerBox.appendChild(imgRO);
                }

                if (sigLabelText) {
                    var lineAreaRO = document.createElement('span');
                    lineAreaRO.className = 'qform-sig-line-container';
                    lineAreaRO.innerHTML = '<span class="qform-sig-line"></span><span class="qform-sig-label">' +
                        (sigLabelText ? sigLabelText.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + '</span>';
                    answerBox.appendChild(lineAreaRO);
                }
            } else {
                sigContainerRO.classList.add('qform-sig-answer-upload-wrapper');
                answerBox.classList.add('qform-sig-answer-upload-box');

                if (sigVal) {
                    var imgRO = document.createElement('img');
                    imgRO.className = 'qform-sig-answer-img qform-sig-upload-img';
                    imgRO.src = sigVal;
                    imgRO.alt = sigLabelText || 'Assinatura';
                    if (sigWidth) {
                        imgRO.style.width = sigWidth;
                    }
                    answerBox.appendChild(imgRO);
                }

                if (sigLabelText) {
                    var lineAreaRO = document.createElement('span');
                    lineAreaRO.className = 'qform-sig-line-container';
                    lineAreaRO.innerHTML = '<span class="qform-sig-line"></span><span class="qform-sig-label">' +
                        (sigLabelText ? sigLabelText.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + '</span>';
                    answerBox.appendChild(lineAreaRO);
                }
            }

            sigContainerRO.appendChild(answerBox);

            return sigContainerRO;
        }

        var sigContainer = document.createElement('span');
        sigContainer.className = 'qform-signature-wrapper';
        if (width && width !== 'auto') sigContainer.style.width = width;

        if (sigMode === 'upload') {
            sigContainer.classList.add('qform-signature-upload-wrapper');

            var uploadBox = document.createElement('span');
            uploadBox.className = 'qform-sig-upload-box';
            if (height && height !== 'auto') uploadBox.style.height = height;

            var btnSign = document.createElement('button');
            btnSign.type = 'button';
            btnSign.className = 'qform-btn-sign';
            btnSign.innerHTML = '📁 Selecionar Assinatura';

            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'qform-sig-file-input';

            var previewImg = document.createElement('img');
            previewImg.className = 'qform-sig-preview-img';
            previewImg.alt = sigLabelText;
            previewImg.title = 'Duplo clique para alterar a assinatura';

            var hiddenVal = document.createElement('input');
            hiddenVal.type = 'hidden';
            hiddenVal.name = name;
            hiddenVal.className = 'qform-sig-hidden-val';
            if (isRequired) hiddenVal.required = true;

            var hiddenWidth = document.createElement('input');
            hiddenWidth.type = 'hidden';
            hiddenWidth.name = name + '__width';
            hiddenWidth.className = 'qform-sig-hidden-width';

            if (sigVal) {
                previewImg.src = sigVal;
                previewImg.style.display = 'inline-block';
                if (sigWidth) {
                    previewImg.style.width = sigWidth;
                    hiddenWidth.value = sigWidth;
                }
                hiddenVal.value = sigVal;
                btnSign.style.display = 'none';
            }

            var lineArea = document.createElement('span');
            if (sigLabelText) {
                lineArea.className = 'qform-sig-line-container';
                lineArea.innerHTML = '<span class="qform-sig-line"></span><span class="qform-sig-label">' +
                    (sigLabelText ? sigLabelText.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + '</span>';
            }

            uploadBox.appendChild(btnSign);
            uploadBox.appendChild(fileInput);
            uploadBox.appendChild(previewImg);
            uploadBox.appendChild(hiddenVal);
            uploadBox.appendChild(hiddenWidth);

            if (sigLabelText) {
                uploadBox.appendChild(lineArea);
            }
            sigContainer.appendChild(uploadBox);
        } else {
            sigContainer.classList.add('qform-signature-draw-wrapper');

            var drawBox = document.createElement('span');
            drawBox.className = 'qform-sig-draw-box';
            if (height && height !== 'auto') drawBox.style.height = height;

            var overlay = document.createElement('span');
            overlay.className = 'qform-sig-overlay';
            overlay.innerHTML = '<span class="qform-sig-overlay-icon">✍️</span> <span class="qform-sig-overlay-text">Toque ou clique para assinar</span>';

            var canvas = document.createElement('canvas');
            canvas.className = 'qform-sig-canvas';

            var toolbar = document.createElement('span');
            toolbar.className = 'qform-sig-toolbar';

            var btnClear = document.createElement('button');
            btnClear.type = 'button';
            btnClear.className = 'qform-sig-btn-clear';
            btnClear.textContent = 'Limpar';

            toolbar.appendChild(btnClear);

            var hiddenVal = document.createElement('input');
            hiddenVal.type = 'hidden';
            hiddenVal.name = name;
            hiddenVal.className = 'qform-sig-hidden-val';
            if (isRequired) hiddenVal.required = true;

            if (sigVal) {
                hiddenVal.value = sigVal;
                overlay.style.display = 'none';
                toolbar.style.display = 'flex';
                drawBox.classList.add('is-active');

                var drawPreview = document.createElement('img');
                drawPreview.className = 'qform-sig-draw-preview';
                drawPreview.src = sigVal;
                drawPreview.alt = sigLabelText || 'Assinatura';
                drawBox.appendChild(drawPreview);
            }

            var lineArea = document.createElement('span');
            if (sigLabelText) {
                lineArea.className = 'qform-sig-line-container';
                lineArea.innerHTML = '<span class="qform-sig-line"></span><span class="qform-sig-label">' +
                    (sigLabelText ? sigLabelText.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + '</span>';
            }

            drawBox.appendChild(overlay);
            drawBox.appendChild(canvas);
            drawBox.appendChild(toolbar);
            drawBox.appendChild(hiddenVal);
            if (sigLabelText) {
                drawBox.appendChild(lineArea);
            }

            sigContainer.appendChild(drawBox);
        }

        return sigContainer;
    }

    /**
     * Inicializa os listeners interativos do módulo de assinatura
     */
    function init() {
        if (typeof document === 'undefined') return;

        // 1. Cliques em botões de ação (Upload, Ativar Desenho e Limpar)
        document.addEventListener('click', function (event) {
            var target = event.target;
            if (!target) return;

            // A. Botão "Assinar" (Upload) -> aciona seletor de arquivos
            if (target.classList.contains('qform-btn-sign')) {
                var uploadBox = target.closest('.qform-sig-upload-box');
                if (uploadBox) {
                    var fileInput = uploadBox.querySelector('.qform-sig-file-input');
                    if (fileInput) fileInput.click();
                }
                return;
            }

            // B. Clique no Overlay de Ativação do Desenho -> ativa o canvas para desenhar
            var overlay = target.closest('.qform-sig-overlay');
            if (overlay) {
                var drawBox = overlay.closest('.qform-sig-draw-box');
                if (drawBox) {
                    overlay.style.display = 'none';
                    drawBox.classList.add('is-active');

                    var canvas = drawBox.querySelector('.qform-sig-canvas');
                    var toolbar = drawBox.querySelector('.qform-sig-toolbar');
                    if (toolbar) toolbar.style.display = 'flex';

                    if (canvas) {
                        canvas.style.display = 'block';

                        var rect = canvas.getBoundingClientRect();
                        var w = drawBox.clientWidth || Math.max(Math.round(rect.width), 100);
                        var h = drawBox.clientHeight || Math.max(Math.round(rect.height), 60);

                        canvas.style.width = w + 'px';
                        canvas.style.height = h + 'px';

                        if (!canvas._sigPad && typeof czSignature !== 'undefined') {
                            var hiddenVal = drawBox.querySelector('.qform-sig-hidden-val');
                            canvas._sigPad = new czSignature(canvas, {
                                penColor: '#000000',
                                backgroundColor: 'transparent',
                                minWidth: 1,
                                maxWidth: 3.0,
                                velocitySensitivity: 3.0,
                                taperStart: 2,
                                taperEnd: 2,
                                pressureSupport: false,
                                smoothingMode: 'live',
                                smoothingRatio: 0.5,
                                minDistance: 0.8,
                                smoothingFadePoints: 4,
                                trimOutput: false
                            });
                            canvas._sigPad.on('drawEnd', function () {
                                if (hiddenVal) {
                                    hiddenVal.value = canvas._sigPad.toDataURL('image/png');
                                    hiddenVal.dispatchEvent(new Event('input', { bubbles: true }));
                                    hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            });
                        }
                    }
                }
                return;
            }

            // C. Botão "Limpar" assinatura a punho
            if (target.classList.contains('qform-sig-btn-clear')) {
                var drawBox = target.closest('.qform-sig-draw-box');
                if (drawBox) {
                    var drawPreview = drawBox.querySelector('.qform-sig-draw-preview');
                    if (drawPreview && drawPreview.parentNode) {
                        drawPreview.parentNode.removeChild(drawPreview);
                    }
                    var canvas = drawBox.querySelector('.qform-sig-canvas');
                    var hiddenVal = drawBox.querySelector('.qform-sig-hidden-val');
                    if (canvas && canvas._sigPad) {
                        canvas._sigPad.clear();
                    } else if (canvas) {
                        var ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    if (canvas) {
                        canvas.style.display = 'block';
                    }
                    if (hiddenVal) {
                        hiddenVal.value = '';
                        hiddenVal.dispatchEvent(new Event('input', { bubbles: true }));
                        hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                return;
            }
        });

        // 2. Seleção de imagem via upload
        document.addEventListener('change', function (event) {
            var target = event.target;
            if (target && target.classList.contains('qform-sig-file-input')) {
                var file = target.files && target.files[0];
                if (file) {
                    var uploadBox = target.closest('.qform-sig-upload-box');
                    if (uploadBox) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var dataUrl = e.target.result;
                            var previewImg = uploadBox.querySelector('.qform-sig-preview-img');
                            var hiddenVal = uploadBox.querySelector('.qform-sig-hidden-val');
                            var btnSign = uploadBox.querySelector('.qform-btn-sign');

                            if (previewImg) {
                                previewImg.src = dataUrl;
                                previewImg.style.display = 'inline-block';
                                previewImg.title = 'Duplo clique para alterar a assinatura';
                            }
                            if (hiddenVal) {
                                hiddenVal.value = dataUrl;
                                hiddenVal.dispatchEvent(new Event('input', { bubbles: true }));
                                hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                            if (btnSign) {
                                btnSign.style.display = 'none';
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
        });

        // 2b. Duplo clique na imagem de assinatura para alterar
        document.addEventListener('dblclick', function (event) {
            var target = event.target;
            if (target && target.classList.contains('qform-sig-preview-img')) {
                var uploadBox = target.closest('.qform-sig-upload-box');
                if (uploadBox) {
                    var fileInput = uploadBox.querySelector('.qform-sig-file-input');
                    if (fileInput) {
                        ocultarResizer();
                        fileInput.click();
                    }
                }
            }
        });

        // Gerenciamento de foco ativo (.is-active)
        document.addEventListener('pointerdown', function (event) {
            var target = event.target;
            var clickedDrawBox = target && target.closest ? target.closest('.qform-sig-draw-box') : null;

            var activeBoxes = document.querySelectorAll('.qform-sig-draw-box.is-active');
            for (var i = 0; i < activeBoxes.length; i++) {
                if (activeBoxes[i] !== clickedDrawBox) {
                    activeBoxes[i].classList.remove('is-active');
                }
            }

            if (clickedDrawBox) {
                var ov = clickedDrawBox.querySelector('.qform-sig-overlay');
                if (!ov || ov.style.display === 'none') {
                    clickedDrawBox.classList.add('is-active');
                }
            }
        });

        document.addEventListener('focusin', function (event) {
            var target = event.target;
            var focusedDrawBox = target && target.closest ? target.closest('.qform-sig-draw-box') : null;
            var activeBoxes = document.querySelectorAll('.qform-sig-draw-box.is-active');
            for (var i = 0; i < activeBoxes.length; i++) {
                if (activeBoxes[i] !== focusedDrawBox) {
                    activeBoxes[i].classList.remove('is-active');
                }
            }
        });

        // 4. Redimensionamento interativo de imagem de assinatura (alça SE-resize)
        var resizerOverlay = null;
        var activeResizingImg = null;
        var isResizing = false;
        var resizeStartX = 0, resizeStartY = 0, resizeStartW = 0, resizeStartH = 0;

        function ocultarResizer() {
            if (resizerOverlay && resizerOverlay.parentNode) {
                resizerOverlay.parentNode.removeChild(resizerOverlay);
            }
            resizerOverlay = null;
            activeResizingImg = null;
        }

        function atualizarResizerPos() {
            if (!activeResizingImg || !resizerOverlay) return;
            var rect = activeResizingImg.getBoundingClientRect();
            var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;

            resizerOverlay.style.top = (rect.top + scrollY) + 'px';
            resizerOverlay.style.left = (rect.left + scrollX) + 'px';
            resizerOverlay.style.width = rect.width + 'px';
            resizerOverlay.style.height = rect.height + 'px';
        }

        document.addEventListener('click', function (event) {
            var target = event.target;
            if (target && target.classList.contains('qform-sig-preview-img')) {
                ocultarResizer();
                activeResizingImg = target;

                resizerOverlay = document.createElement('div');
                resizerOverlay.className = 'qform-sig-resizer-overlay';

                var handleSE = document.createElement('div');
                handleSE.className = 'qform-sig-resizer-handle';

                handleSE.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    isResizing = true;
                    resizeStartX = e.clientX;
                    resizeStartY = e.clientY;
                    resizeStartW = activeResizingImg.getBoundingClientRect().width;
                    resizeStartH = activeResizingImg.getBoundingClientRect().height;

                    function onMouseMove(ev) {
                        if (!isResizing || !activeResizingImg) return;
                        var deltaX = ev.clientX - resizeStartX;
                        var newW = Math.max(resizeStartW + deltaX, 60);
                        var newWStr = newW + 'px';
                        activeResizingImg.style.width = newWStr;
                        activeResizingImg.style.maxWidth = '100%';
                        activeResizingImg.style.height = 'auto';

                        var uploadBox = activeResizingImg.closest('.qform-sig-upload-box');
                        if (uploadBox) {
                            var hw = uploadBox.querySelector('.qform-sig-hidden-width');
                            if (hw) {
                                hw.value = newWStr;
                            }
                        }
                        atualizarResizerPos();
                    }

                    function onMouseUp() {
                        if (isResizing && activeResizingImg) {
                            var uploadBox = activeResizingImg.closest('.qform-sig-upload-box');
                            if (uploadBox) {
                                var hw = uploadBox.querySelector('.qform-sig-hidden-width');
                                if (hw) {
                                    hw.value = activeResizingImg.style.width;
                                    hw.dispatchEvent(new Event('input', { bubbles: true }));
                                    hw.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }
                        }
                        isResizing = false;
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    }

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });

                resizerOverlay.appendChild(handleSE);
                document.body.appendChild(resizerOverlay);
                atualizarResizerPos();
                event.stopPropagation();
                return;
            }

            if (!isResizing && (!target.closest || !target.closest('.qform-sig-preview-img'))) {
                ocultarResizer();
            }
        });

        window.addEventListener('resize', atualizarResizerPos);
        window.addEventListener('scroll', atualizarResizerPos, true);
    }

    return {
        type: 'signature',
        render: render,
        init: init
    };
})();

if (typeof FieldRegistry !== 'undefined') {
    FieldRegistry.register(SignatureField);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignatureField;
}

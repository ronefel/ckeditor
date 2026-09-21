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

    var styles = '' +
        '.qform-signature-wrapper { display: inline-block; vertical-align: top; box-sizing: border-box; font-family: inherit; text-align: left; }' +
        '.qform-signature-upload-wrapper { display: inline-block; vertical-align: top; }' +
        '.qform-sig-upload-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; box-sizing: border-box; overflow: hidden; }' +
        '.qform-btn-sign { background-color: #2563eb; color: #ffffff; border: none; padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; display: inline-flex; align-items: center; gap: 6px; }' +
        '.qform-btn-sign:hover { background-color: #1d4ed8; }' +
        '.qform-btn-sign:active { transform: scale(0.98); }' +
        '.qform-btn-sign.qform-btn-signed { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }' +
        '.qform-btn-sign.qform-btn-signed:hover { background-color: #e2e8f0; }' +
        '.qform-sig-preview-img { display: inline-block; max-width: 100%; max-height: 100%; border: 1px dashed #cbd5e1; border-radius: 4px; background-color: #fff; cursor: pointer; box-sizing: border-box; }' +
        '.qform-signature-draw-wrapper { display: inline-block; vertical-align: top; }' +
        '.qform-sig-draw-box { display: block; position: relative; background-color: transparent; border: 1.5px dashed #94a3b8; border-radius: 6px; box-sizing: border-box; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }' +
        '.qform-sig-draw-box.is-active { border-style: solid; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }' +
        '.qform-sig-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; color: #475569; font-size: 13px; font-weight: 500; cursor: pointer; user-select: none; z-index: 3; transition: background 0.15s; box-sizing: border-box; padding-bottom: 24px; }' +
        '.qform-sig-overlay-icon { font-size: 18px; }' +
        '.qform-sig-canvas { width: 100%; height: 100%; display: block; cursor: crosshair; position: absolute; top: 0; left: 0; z-index: 2; background: transparent; }' +
        '.qform-sig-toolbar { position: absolute; top: 6px; right: 6px; display: flex; gap: 6px; z-index: 4; }' +
        '.qform-sig-btn-clear { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); transition: all 0.15s; }' +
        '.qform-sig-btn-clear:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }' +
        '.qform-sig-line-container { display: block; width: 100%; box-sizing: border-box; }' +
        '.qform-sig-draw-box .qform-sig-line-container { position: absolute; bottom: 8px; left: 12px; right: 12px; width: auto; pointer-events: none; z-index: 1; }' +
        '.qform-sig-line { display: block; border-bottom: 1.5px solid #475569; width: 100%; margin-bottom: 3px; }' +
        '.qform-sig-label { display: block; font-size: 12px; color: #475569; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }';

    function render(campo, options) {
        var name = campo.getAttribute('data-qfield-name') || 'campo';
        var label = campo.getAttribute('data-qfield-label') || '';
        var width = campo.getAttribute('data-qfield-width') || 'auto';
        var height = campo.getAttribute('data-qfield-height') || 'auto';
        var isRequired = campo.getAttribute('data-qfield-required') === 'true';
        var placeholder = campo.getAttribute('data-qfield-placeholder') || '';
        var sigMode = campo.getAttribute('data-qfield-sigmode') || 'draw';

        var sigContainer = document.createElement('span');
        sigContainer.className = 'qform-signature-wrapper';
        if (width && width !== 'auto') sigContainer.style.width = width;
        sigContainer.style.maxWidth = '100%';
        sigContainer.style.display = (width === '100%') ? 'block' : 'inline-block';
        sigContainer.style.verticalAlign = 'top';

        var sigLabelText = label || placeholder || '';

        if (sigMode === 'upload') {
            sigContainer.classList.add('qform-signature-upload-wrapper');

            var uploadBox = document.createElement('span');
            uploadBox.className = 'qform-sig-upload-box';
            var effHeightUpload = (height && height !== 'auto') ? height : '110px';
            uploadBox.style.height = effHeightUpload;

            var btnSign = document.createElement('button');
            btnSign.type = 'button';
            btnSign.className = 'qform-btn-sign';
            btnSign.innerHTML = '📁 Selecionar Assinatura';

            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'qform-sig-file-input';
            fileInput.style.display = 'none';

            var previewImg = document.createElement('img');
            previewImg.className = 'qform-sig-preview-img';
            previewImg.alt = sigLabelText;
            previewImg.title = 'Duplo clique para alterar a assinatura';
            previewImg.style.display = 'none';
            if (width && width !== 'auto' && width !== '100%') previewImg.style.maxWidth = width;
            if (height && height !== 'auto') previewImg.style.maxHeight = height;

            var hiddenVal = document.createElement('input');
            hiddenVal.type = 'hidden';
            hiddenVal.name = name;
            hiddenVal.className = 'qform-sig-hidden-val';
            if (isRequired) hiddenVal.required = true;

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

            sigContainer.appendChild(uploadBox);
            if (sigLabelText) {
                sigContainer.appendChild(lineArea);
            }
        } else {
            sigContainer.classList.add('qform-signature-draw-wrapper');

            var drawBox = document.createElement('span');
            drawBox.className = 'qform-sig-draw-box';
            var effHeight = (height && height !== 'auto') ? height : '130px';
            drawBox.style.height = effHeight;

            var overlay = document.createElement('span');
            overlay.className = 'qform-sig-overlay';
            overlay.innerHTML = '<span class="qform-sig-overlay-icon">✍️</span> <span class="qform-sig-overlay-text">Toque ou clique para assinar</span>';

            var canvas = document.createElement('canvas');
            canvas.className = 'qform-sig-canvas';
            canvas.style.display = 'none';
            canvas.style.touchAction = 'none';

            var toolbar = document.createElement('span');
            toolbar.className = 'qform-sig-toolbar';
            toolbar.style.display = 'none';

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

                        // Inicializa dimensões de alta definição (Retina / Mobile / Tablet com supersampling 2x mínimo)
                        var rect = canvas.getBoundingClientRect();
                        var dpr = Math.max(window.devicePixelRatio || 1, 2);
                        var w = drawBox.clientWidth || Math.max(Math.round(rect.width), 100);
                        var h = drawBox.clientHeight || Math.max(Math.round(rect.height), 60);

                        canvas.width = Math.round(w * dpr);
                        canvas.height = Math.round(h * dpr);
                        canvas.style.width = w + 'px';
                        canvas.style.height = h + 'px';

                        var ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.scale(dpr, dpr);
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.strokeStyle = '#0f172a';
                        ctx.lineWidth = 2.2;
                    }
                }
                return;
            }

            // C. Botão "Limpar" assinatura a punho
            if (target.classList.contains('qform-sig-btn-clear')) {
                var drawBox = target.closest('.qform-sig-draw-box');
                if (drawBox) {
                    var canvas = drawBox.querySelector('.qform-sig-canvas');
                    var hiddenVal = drawBox.querySelector('.qform-sig-hidden-val');
                    if (canvas) {
                        var ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

        // ==========================================
        // MOTOR CALIGRÁFICO DE ALTA FIDELIDADE (Cubic Bézier + Dynamic Ink)
        // ==========================================
        var MIN_STROKE_WIDTH = 1.2;
        var MAX_STROKE_WIDTH = 2.8;
        var VELOCITY_FILTER_WEIGHT = 0.7;
        var INK_COLOR = '#0f172a';

        function SigPoint(x, y, time) {
            this.x = x;
            this.y = y;
            this.time = time || Date.now();
        }
        SigPoint.prototype.distanceTo = function (start) {
            return Math.sqrt(Math.pow(this.x - start.x, 2) + Math.pow(this.y - start.y, 2));
        };
        SigPoint.prototype.velocityFrom = function (start) {
            return (this.time !== start.time) ? this.distanceTo(start) / (this.time - start.time) : 0;
        };

        function calculateCurveControlPoints(s1, s2, s3) {
            var dx1 = s1.x - s2.x;
            var dy1 = s1.y - s2.y;
            var dx2 = s2.x - s3.x;
            var dy2 = s2.y - s3.y;

            var m1 = { x: (s1.x + s2.x) / 2.0, y: (s1.y + s2.y) / 2.0 };
            var m2 = { x: (s2.x + s3.x) / 2.0, y: (s2.y + s3.y) / 2.0 };

            var l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            var l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            var dxm = m1.x - m2.x;
            var dym = m1.y - m2.y;

            var k = (l2 + l1 !== 0) ? l2 / (l1 + l2) : 0;
            var cm = { x: m2.x + dxm * k, y: m2.y + dym * k };

            var tx = s2.x - cm.x;
            var ty = s2.y - cm.y;

            return {
                c1: new SigPoint(m1.x + tx, m1.y + ty),
                c2: new SigPoint(m2.x + tx, m2.y + ty)
            };
        }

        function drawBezierCurve(ctx, p0, c1, c2, p1, startWidth, endWidth) {
            var widthDelta = endWidth - startWidth;
            var len = p0.distanceTo(c1) + c1.distanceTo(c2) + c2.distanceTo(p1);
            var drawSteps = Math.max(Math.floor(len * 2.5), 2);

            ctx.fillStyle = INK_COLOR;

            for (var i = 0; i <= drawSteps; i++) {
                var t = i / drawSteps;
                var tt = t * t;
                var ttt = tt * t;
                var u = 1 - t;
                var uu = u * u;
                var uuu = uu * u;

                var x = uuu * p0.x + 3 * uu * t * c1.x + 3 * u * tt * c2.x + ttt * p1.x;
                var y = uuu * p0.y + 3 * uu * t * c1.y + 3 * u * tt * c2.y + ttt * p1.y;

                var width = startWidth + t * widthDelta;

                ctx.beginPath();
                ctx.arc(x, y, width / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function strokeWidthForVelocity(velocity) {
            return Math.max(MAX_STROKE_WIDTH / (velocity + 1), MIN_STROKE_WIDTH);
        }

        var activeCanvas = null;
        var isDrawing = false;
        var sigPoints = [];
        var lastVelocity = 0;
        var lastWidth = (MIN_STROKE_WIDTH + MAX_STROKE_WIDTH) / 2;

        function addSigPoint(ctx, newPoint) {
            sigPoints.push(newPoint);

            if (sigPoints.length > 2) {
                if (sigPoints.length === 3) {
                    sigPoints.unshift(sigPoints[0]);
                }

                var p0 = sigPoints[0];
                var p1 = sigPoints[1];
                var p2 = sigPoints[2];
                var p3 = sigPoints[3];

                var ctrlPoints = calculateCurveControlPoints(p0, p1, p2);
                var ctrlPoints2 = calculateCurveControlPoints(p1, p2, p3);

                var c1 = ctrlPoints.c2;
                var c2 = ctrlPoints2.c1;

                var v = p2.velocityFrom(p1);
                v = VELOCITY_FILTER_WEIGHT * v + (1 - VELOCITY_FILTER_WEIGHT) * lastVelocity;

                var newWidth = strokeWidthForVelocity(v);

                drawBezierCurve(ctx, p1, c1, c2, p2, lastWidth, newWidth);

                lastVelocity = v;
                lastWidth = newWidth;

                sigPoints.shift();
            }
        }

        document.addEventListener('pointerdown', function (event) {
            var target = event.target;
            var clickedDrawBox = target && target.closest ? target.closest('.qform-sig-draw-box') : null;

            // Remove borda azul (.is-active) de qualquer outro drawBox ao perder o foco
            var activeBoxes = document.querySelectorAll('.qform-sig-draw-box.is-active');
            for (var i = 0; i < activeBoxes.length; i++) {
                if (activeBoxes[i] !== clickedDrawBox) {
                    activeBoxes[i].classList.remove('is-active');
                }
            }

            // Se clicou no drawBox (e o overlay já não está na tela), garante foco ativo
            if (clickedDrawBox) {
                var ov = clickedDrawBox.querySelector('.qform-sig-overlay');
                if (!ov || ov.style.display === 'none') {
                    clickedDrawBox.classList.add('is-active');
                }
            }

            if (target && target.classList.contains('qform-sig-canvas')) {
                activeCanvas = target;
                isDrawing = true;
                if (target.setPointerCapture) {
                    try { target.setPointerCapture(event.pointerId); } catch (e) { }
                }

                var rect = target.getBoundingClientRect();
                var x = event.clientX - rect.left;
                var y = event.clientY - rect.top;

                sigPoints = [];
                lastVelocity = 0;
                lastWidth = (MIN_STROKE_WIDTH + MAX_STROKE_WIDTH) / 2;

                var pt = new SigPoint(x, y, event.timeStamp || Date.now());
                sigPoints.push(pt);

                var ctx = target.getContext('2d');
                ctx.fillStyle = INK_COLOR;
                ctx.beginPath();
                ctx.arc(x, y, lastWidth / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Perda de foco via teclado (Tab entre campos)
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

        document.addEventListener('pointermove', function (event) {
            if (!isDrawing || !activeCanvas) return;

            var rect = activeCanvas.getBoundingClientRect();
            var ctx = activeCanvas.getContext('2d');

            // Usa eventos coalescidos do hardware se suportado pelo navegador (120Hz-240Hz)
            var events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];

            for (var j = 0; j < events.length; j++) {
                var ev = events[j];
                var x = ev.clientX - rect.left;
                var y = ev.clientY - rect.top;

                var lastPt = sigPoints[sigPoints.length - 1];
                if (lastPt) {
                    var dx = x - lastPt.x;
                    var dy = y - lastPt.y;
                    if (dx * dx + dy * dy < 1.5) continue;
                }

                var newPt = new SigPoint(x, y, ev.timeStamp || Date.now());
                addSigPoint(ctx, newPt);
            }
        });

        function finalizarDesenho() {
            if (!isDrawing || !activeCanvas) return;
            isDrawing = false;

            var ctx = activeCanvas.getContext('2d');

            // Conclui o último segmento de ponto pendente se houver
            if (sigPoints.length > 1) {
                var p1 = sigPoints[sigPoints.length - 2];
                var p2 = sigPoints[sigPoints.length - 1];
                drawBezierCurve(ctx, p1, p1, p2, p2, lastWidth, lastWidth);
            }
            sigPoints = [];

            var drawBox = activeCanvas.closest('.qform-sig-draw-box');
            if (drawBox) {
                var hiddenVal = drawBox.querySelector('.qform-sig-hidden-val');
                if (hiddenVal) {
                    hiddenVal.value = activeCanvas.toDataURL('image/png');
                    hiddenVal.dispatchEvent(new Event('input', { bubbles: true }));
                    hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            activeCanvas = null;
        }

        document.addEventListener('pointerup', finalizarDesenho);
        document.addEventListener('pointercancel', finalizarDesenho);

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
                resizerOverlay.style.position = 'absolute';
                resizerOverlay.style.border = '1.5px dashed #2563eb';
                resizerOverlay.style.boxSizing = 'border-box';
                resizerOverlay.style.zIndex = '99999';
                resizerOverlay.style.pointerEvents = 'none';

                var handleSE = document.createElement('div');
                handleSE.style.position = 'absolute';
                handleSE.style.width = '10px';
                handleSE.style.height = '10px';
                handleSE.style.right = '-5px';
                handleSE.style.bottom = '-5px';
                handleSE.style.backgroundColor = '#2563eb';
                handleSE.style.border = '1px solid #ffffff';
                handleSE.style.cursor = 'se-resize';
                handleSE.style.pointerEvents = 'auto';

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
                        activeResizingImg.style.width = newW + 'px';
                        activeResizingImg.style.maxWidth = '100%';
                        activeResizingImg.style.height = 'auto';
                        atualizarResizerPos();
                    }

                    function onMouseUp() {
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
        styles: styles,
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

/**
 * QFieldsRenderer - Utilitário para converter o HTML do CKEditor 4 em um Formulário de Resposta
 * 
 * Uso:
 *   const htmlFormulario = QFieldsRenderer.render(htmlSalvoDoCKEditor);
 *   document.getElementById('meuContainer').innerHTML = htmlFormulario;
 */
var QFieldsRenderer = (function () {
    'use strict';

    /**
     * Renderiza o HTML do template transformando os widgets em inputs reais
     * @param {string} htmlTemplate - HTML retornado pelo editor.getData()
     * @param {object} [options] - Opções adicionais de customização de classes
     * @returns {string} HTML com o texto estático e os campos editáveis
     */
    function render(htmlTemplate, options) {
        if (!htmlTemplate) return '';

        options = options || {};
        var textClass = options.textClass || 'qform-input-text';
        var selectClass = options.selectClass || 'qform-select';
        var textareaClass = options.textareaClass || 'qform-textarea';
        var checkboxLabelClass = options.checkboxLabelClass || 'qform-checkbox-label';
        var radioLabelClass = options.radioLabelClass || 'qform-radio-label';

        var wrapper = document.createElement('div');
        wrapper.innerHTML = htmlTemplate;

        // 1. Processa campos criados com o plugin qfields (.qfield-widget)
        var camposWidget = wrapper.querySelectorAll('.qfield-widget');

        camposWidget.forEach(function (campo) {
            var type = campo.getAttribute('data-qfield-type') || 'text';
            var name = campo.getAttribute('data-qfield-name') || 'campo';
            var label = campo.getAttribute('data-qfield-label') || '';
            var width = campo.getAttribute('data-qfield-width') || 'auto';
            var height = campo.getAttribute('data-qfield-height') || 'auto';
            var isRequired = campo.getAttribute('data-qfield-required') === 'true';
            var placeholder = campo.getAttribute('data-qfield-placeholder') || '';
            var optionsRaw = campo.getAttribute('data-qfield-options') || '';
            var defaultValue = campo.getAttribute('data-qfield-default') || '';

            var targetNode = null;

            switch (type) {
                case 'text':
                    var input = document.createElement('input');
                    input.type = 'text';
                    input.name = name;
                    input.className = textClass;
                    if (width) input.style.width = width;
                    if (height && height !== '22px') input.style.height = height;
                    if (placeholder) input.placeholder = placeholder;
                    if (isRequired) input.required = true;

                    var mask = campo.getAttribute('data-qfield-mask') || '';
                    if (mask) {
                        input.setAttribute('data-qfield-mask', mask);
                    }

                    targetNode = input;
                    break;

                case 'textarea':
                    var textarea = document.createElement('textarea');
                    textarea.name = name;
                    textarea.className = textareaClass;
                    if (width) textarea.style.width = width;
                    if (height) {
                        textarea.style.height = height;
                        textarea.style.minHeight = height;
                    }
                    if (placeholder) textarea.placeholder = placeholder;
                    if (isRequired) textarea.required = true;
                    targetNode = textarea;
                    break;

                case 'select':
                    var select = document.createElement('select');
                    select.name = name;
                    select.className = selectClass;
                    if (width) select.style.width = width;
                    if (height && height !== '22px') select.style.height = height;
                    if (isRequired) select.required = true;

                    var defaultOptionText = label || placeholder || 'Selecione...';
                    var placeholderOption = new Option(defaultOptionText, '');
                    select.appendChild(placeholderOption);

                    var optionsList = optionsRaw ? optionsRaw.split(',') : [];
                    var effectiveSelectDefault = '';
                    if (optionsList.length > 0) {
                        optionsList.forEach(function (opt) {
                            var trimmed = opt.trim();
                            if (trimmed.indexOf('*') === 0) {
                                effectiveSelectDefault = trimmed.replace(/^\*/, '').trim();
                            }
                        });
                    }
                    if (!effectiveSelectDefault && defaultValue && defaultValue !== 'true' && defaultValue !== 'false') {
                        effectiveSelectDefault = defaultValue;
                    }

                    optionsList.forEach(function (opt) {
                        var val = opt.trim().replace(/^\*/, '').trim();
                        if (val) {
                            var optElem = new Option(val, val);
                            if (effectiveSelectDefault && val.toLowerCase() === effectiveSelectDefault.toLowerCase()) {
                                optElem.selected = true;
                                optElem.setAttribute('selected', 'selected');
                            }
                            select.appendChild(optElem);
                        }
                    });

                    targetNode = select;
                    break;

                case 'checkbox':
                    var chkContainer = document.createElement('span');
                    chkContainer.className = 'qform-checkbox-container';

                    var chkLabel = document.createElement('label');
                    chkLabel.className = checkboxLabelClass || 'qform-checkbox-label';

                    var chk = document.createElement('input');
                    chk.type = 'checkbox';
                    chk.name = name;
                    chk.value = '1';
                    chk.className = 'qform-checkbox-input';
                    if (isRequired) chk.required = true;
                    var isChecked = defaultValue === 'true' || defaultValue === '1' || defaultValue === 'checked';
                    if (isChecked) {
                        chk.checked = true;
                        chk.setAttribute('checked', 'checked');
                    }

                    var chkBox = document.createElement('span');
                    chkBox.className = 'qform-checkbox-box';
                    chkBox.innerHTML = '(&nbsp;<span class="qform-checkbox-mark">X</span>&nbsp;)';

                    chkLabel.appendChild(chk);
                    chkLabel.appendChild(chkBox);

                    if (label) {
                        var textSpan = document.createElement('span');
                        textSpan.className = 'qform-checkbox-text';
                        textSpan.textContent = ' ' + label;
                        chkLabel.appendChild(textSpan);
                    }

                    chkContainer.appendChild(chkLabel);
                    targetNode = chkContainer;
                    break;

                case 'radio':
                    var radioContainer = document.createElement('span');
                    radioContainer.className = 'qform-radio-container';
                    var radioOptions = optionsRaw ? optionsRaw.split(',') : [];
                    var effectiveRadioDefault = '';
                    if (radioOptions.length > 0) {
                        radioOptions.forEach(function (opt) {
                            var trimmed = opt.trim();
                            if (trimmed.indexOf('*') === 0) {
                                effectiveRadioDefault = trimmed.replace(/^\*/, '').trim();
                            }
                        });
                    }
                    if (!effectiveRadioDefault && defaultValue && defaultValue !== 'true' && defaultValue !== 'false') {
                        effectiveRadioDefault = defaultValue;
                    }

                    if (radioOptions.length > 0) {
                        radioOptions.forEach(function (opt) {
                            var val = opt.trim().replace(/^\*/, '').trim();
                            if (val) {
                                var rLabel = document.createElement('label');
                                rLabel.className = radioLabelClass || 'qform-radio-label';

                                var radio = document.createElement('input');
                                radio.type = 'radio';
                                radio.name = name;
                                radio.value = val;
                                radio.className = 'qform-radio-input';
                                if (isRequired) radio.required = true;
                                if (effectiveRadioDefault && val.toLowerCase() === effectiveRadioDefault.toLowerCase()) {
                                    radio.checked = true;
                                    radio.setAttribute('checked', 'checked');
                                }

                                var radioBox = document.createElement('span');
                                radioBox.className = 'qform-radio-box';
                                radioBox.innerHTML = '(&nbsp;<span class="qform-radio-mark">X</span>&nbsp;)';

                                var textSpan = document.createElement('span');
                                textSpan.className = 'qform-radio-text';
                                textSpan.textContent = val;

                                rLabel.appendChild(radio);
                                rLabel.appendChild(radioBox);
                                rLabel.appendChild(textSpan);
                                radioContainer.appendChild(rLabel);
                            }
                        });
                    } else {
                        var rLabel = document.createElement('label');
                        rLabel.className = radioLabelClass || 'qform-radio-label';

                        var radio = document.createElement('input');
                        radio.type = 'radio';
                        radio.name = name;
                        var radioVal = label || name || '1';
                        radio.value = radioVal;
                        radio.className = 'qform-radio-input';
                        if (isRequired) radio.required = true;
                        if (defaultValue === 'true' || defaultValue === '1' || (defaultValue && defaultValue.toLowerCase() === radioVal.toLowerCase())) {
                            radio.checked = true;
                            radio.setAttribute('checked', 'checked');
                        }

                        var radioBox = document.createElement('span');
                        radioBox.className = 'qform-radio-box';
                        radioBox.innerHTML = '(&nbsp;<span class="qform-radio-mark">X</span>&nbsp;)';

                        rLabel.appendChild(radio);
                        rLabel.appendChild(radioBox);

                        if (label) {
                            var textSpan = document.createElement('span');
                            textSpan.className = 'qform-radio-text';
                            textSpan.textContent = label;
                            rLabel.appendChild(textSpan);
                        }
                        radioContainer.appendChild(rLabel);
                    }
                    targetNode = radioContainer;
                    break;

                case 'signature':
                    var sigMode = campo.getAttribute('data-qfield-sigmode') || 'draw';
                    var sigContainer = document.createElement('div');
                    sigContainer.className = 'qform-signature-wrapper';
                    if (width && width !== 'auto') sigContainer.style.width = width;
                    sigContainer.style.maxWidth = '100%';
                    sigContainer.style.display = (width === '100%') ? 'block' : 'inline-block';
                    sigContainer.style.verticalAlign = 'top';

                    var sigLabelText = label || placeholder || name || 'Assinatura';

                    if (sigMode === 'upload') {
                        // Modo Upload: Botão "Assinar", input file oculto, exibição instantânea da imagem e hidden input
                        sigContainer.classList.add('qform-signature-upload-wrapper');

                        var uploadBox = document.createElement('div');
                        uploadBox.className = 'qform-sig-upload-box';

                        var btnSign = document.createElement('button');
                        btnSign.type = 'button';
                        btnSign.className = 'qform-btn-sign';
                        btnSign.textContent = 'Assinar';

                        var fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.className = 'qform-sig-file-input';
                        fileInput.style.display = 'none';

                        var previewImg = document.createElement('img');
                        previewImg.className = 'qform-sig-preview-img';
                        previewImg.alt = sigLabelText;
                        previewImg.style.display = 'none';
                        if (width && width !== 'auto' && width !== '100%') previewImg.style.maxWidth = width;
                        if (height && height !== 'auto') previewImg.style.maxHeight = height;

                        var hiddenVal = document.createElement('input');
                        hiddenVal.type = 'hidden';
                        hiddenVal.name = name;
                        hiddenVal.className = 'qform-sig-hidden-val';
                        if (isRequired) hiddenVal.required = true;

                        var lineArea = document.createElement('div');
                        lineArea.className = 'qform-sig-line-container';
                        lineArea.innerHTML = '<div class="qform-sig-line"></div><div class="qform-sig-label">' + (sigLabelText ? sigLabelText.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + '</div>';

                        uploadBox.appendChild(btnSign);
                        uploadBox.appendChild(fileInput);
                        uploadBox.appendChild(previewImg);
                        uploadBox.appendChild(hiddenVal);
                        uploadBox.appendChild(lineArea);

                        sigContainer.appendChild(uploadBox);
                    } else {
                        // Modo A Punho: Área de desenho com ativação por toque/clique e botões
                        sigContainer.classList.add('qform-signature-draw-wrapper');

                        var drawBox = document.createElement('div');
                        drawBox.className = 'qform-sig-draw-box';
                        if (width && width !== 'auto') drawBox.style.width = width;
                        var effHeight = (height && height !== 'auto') ? height : '130px';
                        drawBox.style.height = effHeight;

                        var overlay = document.createElement('div');
                        overlay.className = 'qform-sig-overlay';
                        overlay.innerHTML = '<span class="qform-sig-overlay-icon">✍️</span> <span class="qform-sig-overlay-text">Toque ou clique para assinar</span>';

                        var canvas = document.createElement('canvas');
                        canvas.className = 'qform-sig-canvas';
                        canvas.style.display = 'none';
                        canvas.style.touchAction = 'none';

                        var toolbar = document.createElement('div');
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

                        drawBox.appendChild(overlay);
                        drawBox.appendChild(canvas);
                        drawBox.appendChild(toolbar);
                        drawBox.appendChild(hiddenVal);

                        var lineArea = document.createElement('div');
                        lineArea.className = 'qform-sig-line-container';
                        lineArea.innerHTML = '<div class="qform-sig-line"></div><div class="qform-sig-label">' + (sigLabelText ? sigLabelText.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + '</div>';

                        sigContainer.appendChild(drawBox);
                        sigContainer.appendChild(lineArea);
                    }

                    targetNode = sigContainer;
                    break;
            }

            if (targetNode) {
                campo.parentNode.replaceChild(targetNode, campo);
            }
        });

        // 2. Garante que inputs HTML que por ventura já estejam no template também recebam estilos
        var inputsNativos = wrapper.querySelectorAll('input:not([class]), select:not([class]), textarea:not([class])');
        inputsNativos.forEach(function (inputEl) {
            var tag = inputEl.tagName.toLowerCase();
            if (tag === 'textarea') {
                inputEl.className = textareaClass;
            } else if (tag === 'select') {
                inputEl.className = selectClass;
            } else if (inputEl.type === 'text') {
                inputEl.className = textClass;
            }
        });

        return wrapper.innerHTML;
    }

    /**
     * Aplica uma máscara de formatação sobre um valor numérico/alfanumérico
     * Suporta padrões como 999.999.999-99 (CPF), (99) 99999-9999 (Telefone), 99/99/9999 (Data), etc.
     * @param {string} value - Valor atual do campo
     * @param {string} mask - Padrão da máscara
     * @returns {string} Valor formatado
     */
    function formatWithMask(value, mask) {
        if (!value || !mask) return value || '';

        var digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) return '';

        // Ajuste dinâmico inteligente para celular vs fixo no Brasil: (99) 9999-9999 vs (99) 99999-9999
        var effectiveMask = mask;
        if (mask === '(99) 99999-9999' || mask === '(99) 9999-9999') {
            effectiveMask = digitsOnly.length > 10 ? '(99) 99999-9999' : '(99) 9999-9999';
        }

        var formatted = '';
        var digitIndex = 0;

        for (var i = 0; i < effectiveMask.length && digitIndex < digitsOnly.length; i++) {
            var maskChar = effectiveMask.charAt(i);
            if (maskChar === '9' || maskChar === '0') {
                formatted += digitsOnly.charAt(digitIndex);
                digitIndex++;
            } else {
                formatted += maskChar;
            }
        }

        return formatted;
    }

    // Injeta estilos CSS para o formulário de resposta caso ainda não existam
    function injectStyles() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('qfields-renderer-styles')) return;

        var css = '' +
            '.qform-signature-wrapper { box-sizing: border-box; margin: 4px 0; font-family: inherit; }' +
            '.qform-signature-upload-wrapper { display: inline-block; }' +
            '.qform-sig-upload-box { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; }' +
            '.qform-btn-sign { background-color: #2563eb; color: #ffffff; border: none; padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; display: inline-flex; align-items: center; gap: 6px; }' +
            '.qform-btn-sign:hover { background-color: #1d4ed8; }' +
            '.qform-btn-sign:active { transform: scale(0.98); }' +
            '.qform-btn-sign.qform-btn-signed { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }' +
            '.qform-btn-sign.qform-btn-signed:hover { background-color: #e2e8f0; }' +
            '.qform-sig-preview-img { display: inline-block; max-width: 100%; border: 1px dashed #cbd5e1; border-radius: 4px; background-color: #fff; cursor: pointer; box-sizing: border-box; }' +
            '.qform-signature-draw-wrapper { display: inline-block; }' +
            '.qform-sig-draw-box { position: relative; background-color: #ffffff; border: 1.5px dashed #94a3b8; border-radius: 6px; box-sizing: border-box; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }' +
            '.qform-sig-draw-box.is-active { border-style: solid; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }' +
            '.qform-sig-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #f8fafc; color: #475569; font-size: 13px; font-weight: 500; cursor: pointer; user-select: none; z-index: 2; transition: background 0.15s; }' +
            '.qform-sig-overlay:hover { background: #f1f5f9; color: #1e293b; }' +
            '.qform-sig-overlay-icon { font-size: 18px; }' +
            '.qform-sig-canvas { width: 100%; height: 100%; display: block; cursor: crosshair; }' +
            '.qform-sig-toolbar { position: absolute; top: 6px; right: 6px; display: flex; gap: 6px; z-index: 4; }' +
            '.qform-sig-btn-clear { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); transition: all 0.15s; }' +
            '.qform-sig-btn-clear:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }' +
            '.qform-sig-line-container { margin-top: 6px; width: 100%; }' +
            '.qform-sig-line { border-bottom: 1.5px solid #475569; width: 100%; margin-bottom: 3px; }' +
            '.qform-sig-label { font-size: 12px; color: #475569; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }';

        var style = document.createElement('style');
        style.id = 'qfields-renderer-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Inicializa listeners globais para máscaras, uploads e assinaturas interativas
    if (typeof document !== 'undefined') {
        injectStyles();

        // 1. Formatação de máscaras em tempo real
        document.addEventListener('input', function (event) {
            var target = event.target;
            if (target && target.getAttribute && target.getAttribute('data-qfield-mask')) {
                var maskPattern = target.getAttribute('data-qfield-mask');
                var currentVal = target.value;
                var formatted = formatWithMask(currentVal, maskPattern);
                if (currentVal !== formatted) {
                    target.value = formatted;
                }
            }
        });

        // 2. Clique em botões de Assinar (Upload) ou Limpar ou Ativar Desenho
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

                        // Inicializa dimensões de alta definição (Retina / Mobile / Tablet)
                        var rect = canvas.getBoundingClientRect();
                        var dpr = window.devicePixelRatio || 1;
                        var w = Math.max(Math.round(rect.width), 100);
                        var h = Math.max(Math.round(rect.height), 60);

                        canvas.width = Math.round(w * dpr);
                        canvas.height = Math.round(h * dpr);
                        canvas.style.width = w + 'px';
                        canvas.style.height = h + 'px';

                        var ctx = canvas.getContext('2d');
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

        // 3. Seleção de imagem via upload
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
                            }
                            if (hiddenVal) {
                                hiddenVal.value = dataUrl;
                                hiddenVal.dispatchEvent(new Event('input', { bubbles: true }));
                                hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                            if (btnSign) {
                                btnSign.textContent = 'Alterar Assinatura';
                                btnSign.classList.add('qform-btn-signed');
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
        });

        // 4. Desenho a punho com PointerEvents (Suporta Touch, Caneta Stylus de Tablet e Mouse)
        var activeCanvas = null;
        var isDrawing = false;
        var lastX = 0;
        var lastY = 0;

        document.addEventListener('pointerdown', function (event) {
            var target = event.target;
            if (target && target.classList.contains('qform-sig-canvas')) {
                activeCanvas = target;
                isDrawing = true;
                if (target.setPointerCapture) {
                    try { target.setPointerCapture(event.pointerId); } catch (e) { }
                }

                var rect = target.getBoundingClientRect();
                lastX = event.clientX - rect.left;
                lastY = event.clientY - rect.top;

                var ctx = target.getContext('2d');
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
            }
        });

        document.addEventListener('pointermove', function (event) {
            if (!isDrawing || !activeCanvas) return;

            var rect = activeCanvas.getBoundingClientRect();
            var currentX = event.clientX - rect.left;
            var currentY = event.clientY - rect.top;

            var ctx = activeCanvas.getContext('2d');
            ctx.lineTo(currentX, currentY);
            ctx.stroke();

            lastX = currentX;
            lastY = currentY;
        });

        function finalizarDesenho() {
            if (!isDrawing || !activeCanvas) return;
            isDrawing = false;

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

        // 5. Suporte interativo a redimensionamento de imagens de assinatura (imageresize em resposta)
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

                // Alça de redimensionamento canto inferior direito
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
        render: render,
        formatWithMask: formatWithMask
    };
})();

// Suporte para Node / CommonJS se aplicável
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QFieldsRenderer;
}

/**
 * QFields & A4Pages - PDF Exporter Module
 * Utilitário profissional para exportação de documentos e questionários A4 para PDF
 * Utiliza html2pdf.js com alinhamento milimétrico e paginação exata.
 *
 * @version 1.0.0
 * @author Equipe CKEditor / QFields
 * @license MIT
 */
(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['html2pdf'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(typeof html2pdf !== 'undefined' ? html2pdf : require('html2pdf.js'));
    } else {
        var lib = factory(root.html2pdf);
        root.QFieldsPDF = lib;
        // Compatibilidade global legada direta
        root.exportarParaPDF = lib.exportarParaPDF;
        root.baixarPDF = lib.baixarPDF;
        root.gerarBlobPDF = lib.gerarBlobPDF;
        root.gerarBase64PDF = lib.gerarBase64PDF;
    }
}(typeof window !== 'undefined' ? window : this, function (html2pdfLib) {
    'use strict';

    /**
     * Configurações padrão para exportação em formato A4
     */
    var DEFAULT_OPTIONS = {
        filename: 'questionario-respondido.pdf',
        action: 'open',           // 'open' (nova aba) | 'download' (salvar) | 'blob' | 'bloburl'
        pageSelector: '.folha-a4',// Seletor das folhas A4
        scale: 2,                 // Escala html2canvas (2 = alta resolução / ~192dpi)
        useCORS: true,
        letterRendering: true,
        loadingText: '⏳ Gerando PDF...',
        openTabLoadingHtml: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gerando PDF...</title>' +
            '<style>body{margin:0;padding:0;background:#525659;display:flex;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#fff;}' +
            '.loader-box{text-align:center;padding:24px 32px;background:rgba(0,0,0,0.4);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.3);}' +
            '.spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,0.3);border-radius:50%;border-top-color:#38bdf8;animation:spin 1s ease-in-out infinite;margin:0 auto 16px;}' +
            '@keyframes spin{to{transform:rotate(360deg);}}' +
            'p{font-size:16px;margin:0;letter-spacing:0.3px;}</style></head>' +
            '<body><div class="loader-box"><div class="spinner"></div><p>Gerando visualização do PDF, aguarde...</p></div></body></html>'
    };

    /**
     * Localiza o elemento alvo a partir de ID, seletor CSS ou nó DOM
     * @param {string|HTMLElement} target
     * @returns {HTMLElement|null}
     */
    function resolveElement(target) {
        if (!target) return null;
        if (typeof target === 'string') {
            return document.getElementById(target) || document.querySelector(target);
        }
        if (target.nodeType === 1) {
            return target;
        }
        return null;
    }

    /**
     * Clona e normaliza os estilos do documento para renderização sem falhas no A4
     * Remove sombras, bordas e ajusta dimensões estritas (210mm x 296mm) para prevenir páginas vazias.
     * @param {HTMLElement} originalElement
     * @param {string} pageSelector
     * @returns {HTMLElement}
     */
    function preparePrintClone(originalElement, pageSelector) {
        var clone = originalElement.cloneNode(true);

        clone.style.padding = '0';
        clone.style.margin = '0';
        clone.style.width = '210mm';
        clone.style.maxWidth = '210mm';
        clone.style.boxSizing = 'border-box';
        clone.style.backgroundColor = '#ffffff';

        var folhas = clone.querySelectorAll(pageSelector || '.folha-a4');
        if (folhas && folhas.length > 0) {
            folhas.forEach(function (folha, idx) {
                folha.style.margin = '0';
                folha.style.width = '210mm';
                folha.style.maxWidth = '210mm';
                folha.style.boxShadow = 'none';
                folha.style.border = 'none';
                // 296mm evita que o arredondamento de subpixel do canvas (1122.5px -> 1123px) transborde os 297mm do A4
                folha.style.height = '296mm';
                folha.style.maxHeight = '296mm';
                folha.style.boxSizing = 'border-box';
                folha.style.pageBreakAfter = 'auto';
                folha.style.breakAfter = 'auto';

                // Quebra página apenas antes das folhas subsequentes
                if (idx > 0) {
                    folha.style.pageBreakBefore = 'always';
                    folha.style.breakBefore = 'page';
                } else {
                    folha.style.pageBreakBefore = 'auto';
                    folha.style.breakBefore = 'auto';
                }
            });
        }

        return clone;
    }

    /**
     * Valida se a biblioteca html2pdf está carregada
     * @returns {Function|null}
     */
    function getHtml2Pdf() {
        if (typeof html2pdfLib === 'function') {
            return html2pdfLib;
        }
        if (typeof window !== 'undefined' && typeof window.html2pdf === 'function') {
            return window.html2pdf;
        }
        return null;
    }

    /**
     * Executa a exportação de um elemento para PDF
     * @param {string|HTMLElement} target - ID, elemento ou seletor do conteúdo a ser exportado
     * @param {Object} [options] - Opções de configuração
     * @returns {Promise<any>}
     */
    function exportDocument(target, options) {
        options = options || {};
        var h2p = getHtml2Pdf();

        if (!h2p) {
            var msg = 'A biblioteca html2pdf.js não foi encontrada. Certifique-se de incluir vendor/html2pdf.bundle.min.js antes deste script.';
            console.error('[QFieldsPDF]', msg);
            if (typeof alert === 'function') alert(msg);
            return Promise.reject(new Error(msg));
        }

        var elementoOriginal = resolveElement(target);
        if (!elementoOriginal || !elementoOriginal.innerHTML.trim()) {
            var emptyMsg = 'Nenhum conteúdo disponível para gerar o PDF.';
            console.warn('[QFieldsPDF]', emptyMsg);
            if (typeof alert === 'function') alert(emptyMsg);
            return Promise.reject(new Error(emptyMsg));
        }

        // Mescla opções
        var settings = {};
        for (var k in DEFAULT_OPTIONS) {
            settings[k] = DEFAULT_OPTIONS[k];
        }
        for (var optKey in options) {
            if (options.hasOwnProperty(optKey) && options[optKey] !== undefined) {
                settings[optKey] = options[optKey];
            }
        }

        // Garante extensão .pdf
        var nomeFinal = settings.filename || 'documento.pdf';
        if (!nomeFinal.toLowerCase().endsWith('.pdf')) {
            nomeFinal += '.pdf';
        }
        settings.filename = nomeFinal;

        // Feedback no botão de ação, se fornecido
        var btnElement = resolveElement(settings.button || settings.btnElement);
        var textoOriginalBtn = '';
        if (btnElement) {
            textoOriginalBtn = btnElement.innerHTML;
            btnElement.disabled = true;
            btnElement.innerHTML = settings.loadingText;
        }

        function restoreButton() {
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = textoOriginalBtn;
            }
        }

        // Se a ação for 'open', abre a nova aba IMEDIATAMENTE no contexto do clique síncrono
        var novaAba = null;
        var action = (settings.action || 'open').toLowerCase();
        if (action === 'open') {
            novaAba = window.open('', '_blank');
            if (novaAba) {
                novaAba.document.write(settings.openTabLoadingHtml);
            }
        }

        // Prepara clone sanitizado do A4
        var clone = preparePrintClone(elementoOriginal, settings.pageSelector);

        var config = {
            margin: 0,
            filename: settings.filename,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: settings.scale || 2,
                useCORS: settings.useCORS !== false,
                letterRendering: settings.letterRendering !== false,
                scrollY: 0,
                scrollX: 0,
                x: 0,
                y: 0,
                width: 794
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            },
            pagebreak: {
                mode: ['css', 'legacy']
            }
        };

        if (typeof settings.beforeRender === 'function') {
            settings.beforeRender(clone, config);
        }

        // Encadeamento do html2pdf com correção de posicionamento absoluto
        var worker = h2p().set(config).from(clone).toContainer().then(function () {
            if (this.prop && this.prop.container) {
                this.prop.container.style.position = 'absolute';
                this.prop.container.style.left = '0px';
                this.prop.container.style.right = 'auto';
                this.prop.container.style.margin = '0px';
                this.prop.container.style.padding = '0px';
                this.prop.container.style.width = '210mm';
            }
            if (this.prop && this.prop.overlay) {
                this.prop.overlay.style.margin = '0px';
                this.prop.overlay.style.padding = '0px';
            }
        });

        // Trata os diferentes modos de saída
        if (action === 'download' || action === 'save') {
            return worker.save().then(function () {
                restoreButton();
                if (typeof settings.onSuccess === 'function') settings.onSuccess();
                return true;
            }).catch(function (err) {
                restoreButton();
                console.error('[QFieldsPDF] Erro ao salvar PDF:', err);
                if (typeof settings.onError === 'function') settings.onError(err);
                throw err;
            });
        }

        if (action === 'blob') {
            return worker.output('blob').then(function (blob) {
                restoreButton();
                if (typeof settings.onSuccess === 'function') settings.onSuccess(blob);
                return blob;
            }).catch(function (err) {
                restoreButton();
                console.error('[QFieldsPDF] Erro ao gerar Blob:', err);
                if (typeof settings.onError === 'function') settings.onError(err);
                throw err;
            });
        }

        if (action === 'base64' || action === 'datauristring' || action === 'dataurl') {
            return worker.output('datauristring').then(function (dataUri) {
                restoreButton();
                var result = dataUri;
                if (settings.rawBase64 && typeof dataUri === 'string') {
                    result = dataUri.replace(/^data:[^;]+;base64,/, '');
                }
                if (typeof settings.onSuccess === 'function') settings.onSuccess(result);
                return result;
            }).catch(function (err) {
                restoreButton();
                console.error('[QFieldsPDF] Erro ao gerar Base64:', err);
                if (typeof settings.onError === 'function') settings.onError(err);
                throw err;
            });
        }

        if (action === 'arraybuffer') {
            return worker.output('arraybuffer').then(function (ab) {
                restoreButton();
                if (typeof settings.onSuccess === 'function') settings.onSuccess(ab);
                return ab;
            }).catch(function (err) {
                restoreButton();
                console.error('[QFieldsPDF] Erro ao gerar ArrayBuffer:', err);
                if (typeof settings.onError === 'function') settings.onError(err);
                throw err;
            });
        }

        // Default: 'open' ou 'bloburl'
        return worker.output('bloburl').then(function (blobUrl) {
            restoreButton();

            if (action === 'bloburl') {
                if (novaAba && !novaAba.closed) novaAba.close();
                if (typeof settings.onSuccess === 'function') settings.onSuccess(blobUrl);
                return blobUrl;
            }

            if (novaAba && !novaAba.closed) {
                novaAba.document.title = settings.filename;
                novaAba.document.body.style.margin = '0';
                novaAba.document.body.innerHTML = '<iframe src="' + blobUrl + '" style="position:fixed;top:0;left:0;width:100%;height:100%;border:none;" frameborder="0"></iframe>';

                // Libera o blobUrl quando a aba for fechada
                try {
                    novaAba.addEventListener('unload', function () {
                        URL.revokeObjectURL(blobUrl);
                    });
                } catch (e) { }
            } else {
                // Fallback se o navegador bloqueou o popup inicial
                window.open(blobUrl, '_blank');
            }

            if (typeof settings.onSuccess === 'function') settings.onSuccess(blobUrl);
            return blobUrl;
        }).catch(function (erro) {
            restoreButton();
            console.error('[QFieldsPDF] Erro ao gerar PDF:', erro);
            if (novaAba && !novaAba.closed) {
                novaAba.close();
            }
            if (typeof settings.onError === 'function') {
                settings.onError(erro);
            } else {
                alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
            }
            throw erro;
        });
    }

    /**
     * Atalho direto para abertura em nova aba (compatível com a assinatura anterior)
     * @param {string|HTMLElement} target - ID ou elemento
     * @param {string} [nomeArquivo] - Nome do arquivo
     * @param {HTMLElement} [btnElement] - Botão acionador
     * @returns {Promise<any>}
     */
    function exportarParaPDF(target, nomeArquivo, btnElement) {
        return exportDocument(target, {
            filename: nomeArquivo,
            button: btnElement,
            action: 'open'
        });
    }

    /**
     * Atalho direto para download do arquivo PDF
     * @param {string|HTMLElement} target
     * @param {string} [nomeArquivo]
     * @param {HTMLElement} [btnElement]
     * @returns {Promise<any>}
     */
    function baixarPDF(target, nomeArquivo, btnElement) {
        return exportDocument(target, {
            filename: nomeArquivo,
            button: btnElement,
            action: 'download'
        });
    }

    /**
     * Gera o Blob binário do PDF para envio ao backend ou manipulação direta
     * @param {string|HTMLElement} target - ID ou elemento alvo
     * @param {string|Object} [optionsOrFilename] - Nome do arquivo ou objeto de opções
     * @param {HTMLElement} [btnElement] - Botão acionador (opcional)
     * @returns {Promise<Blob>}
     */
    function gerarBlob(target, optionsOrFilename, btnElement) {
        var opts = typeof optionsOrFilename === 'string'
            ? { filename: optionsOrFilename, button: btnElement }
            : (optionsOrFilename || {});
        opts.action = 'blob';
        return exportDocument(target, opts);
    }

    /**
     * Gera a representação em Base64 do PDF (ideal para envio via JSON para APIs)
     * @param {string|HTMLElement} target - ID ou elemento alvo
     * @param {Object} [options] - Opções { filename, button, rawBase64: boolean }
     * @returns {Promise<string>}
     */
    function gerarBase64(target, options) {
        var opts = options || {};
        opts.action = 'base64';
        return exportDocument(target, opts);
    }

    return {
        exportarParaPDF: exportarParaPDF,
        baixarPDF: baixarPDF,
        gerarBlobPDF: gerarBlob,
        gerarBase64PDF: gerarBase64,
        preparePrintClone: preparePrintClone,
        DEFAULT_OPTIONS: DEFAULT_OPTIONS
    };
}));

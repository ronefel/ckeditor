(function () {
	function getSelectedParagraphs(editor) {
		var selection = editor.getSelection();
		if (!selection) return [];
		var blocks = [];
		var seen = {};

		function isBlock(el) {
			return el && el.type === CKEDITOR.NODE_ELEMENT && el.is('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'li', 'td', 'th');
		}

		function getAscendantBlock(el) {
			if (!el) return null;
			if (isBlock(el)) return el;
			return el.getAscendant({ p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, div: 1, li: 1, td: 1, th: 1 }, true);
		}

		function addBlock(block) {
			if (!block) return;
			if (block.equals(editor.editable())) return;
			var id = block.getCustomData('lh_id') || CKEDITOR.tools.getNextId();
			block.setCustomData('lh_id', id);
			if (!seen[id]) {
				seen[id] = true;
				blocks.push(block);
			}
		}

		// 1. Se um widget estiver focado, aplica diretamente no parágrafo/bloco pai do widget
		if (editor.widgets && editor.widgets.focused) {
			var widget = editor.widgets.focused;
			var widgetBlock = getAscendantBlock(widget.element);
			if (widgetBlock) {
				addBlock(widgetBlock);
				return blocks;
			}
		}

		var ranges = selection.getRanges();
		if (!ranges || !ranges.length) {
			var start = selection.getStartElement();
			addBlock(getAscendantBlock(start));
			return blocks;
		}

		for (var i = 0; i < ranges.length; i++) {
			var range = ranges[i];
			var startNode = range.startContainer;
			var endNode = range.endContainer;

			var startBlock = getAscendantBlock(startNode);
			var endBlock = getAscendantBlock(endNode);

			if (startBlock && endBlock && startBlock.equals(endBlock)) {
				addBlock(startBlock);
			} else {
				if (startBlock) addBlock(startBlock);

				// Se abrange múltiplos blocos, busca blocos dentro do ancestral comum sem criar novos parágrafos
				var common = range.getCommonAncestor(true, true);
				if (common) {
					var walkerRange = range.clone();
					var walker = new CKEDITOR.dom.walker(walkerRange);
					var node;
					while ((node = walker.next())) {
						if (isBlock(node)) {
							addBlock(node);
						} else {
							var parentBlock = getAscendantBlock(node);
							if (parentBlock && !parentBlock.equals(common)) {
								addBlock(parentBlock);
							}
						}
					}
				}

				if (endBlock) addBlock(endBlock);
			}
		}

		if (!blocks.length) {
			var path = editor.elementPath();
			if (path && path.block) {
				addBlock(path.block);
			} else if (path && path.blockLimit) {
				addBlock(getAscendantBlock(path.blockLimit));
			}
		}

		return blocks;
	}

	function addCombo(editor, comboName, styleType, lang, entries, defaultLabel, styleDefinition, order) {
		var config = editor.config;
		var names = (entries || '').split(';');

		editor.ui.addRichCombo(comboName, {
			label: editor.lang.lineheight.title,
			title: editor.lang.lineheight.title,
			toolbar: 'styles,' + order,
			allowedContent: 'p h1 h2 h3 h4 h5 h6 div li{line-height}',
			panel: {
				css: [CKEDITOR.skin.getPath('editor')].concat(config.contentsCss),
				multiSelect: false,
				attributes: { 'aria-label': editor.lang.lineheight.title }
			},
			init: function () {
				var lang = editor.lang.lineheight;
				var defaultOptionLabel = '(' + (editor.lang.common.optionDefault || 'Padrão') + ')';

				this.startGroup(lang.title);
				// Primeira opção: (Padrão), idêntico ao select de tamanho da fonte (FontSize)
				this.add('', defaultOptionLabel, defaultOptionLabel);

				for (var i = 0; i < names.length; i++) {
					var parts = names[i].split('/');
					var name = parts[0];
					var val = parts[1] || name;
					this.add(val, '<div style="line-height:' + val + ';">' + name + '</div>', name);
				}
			},
			onClick: function (value) {
				editor.focus();
				editor.fire('saveSnapshot');
				var blocks = getSelectedParagraphs(editor);
				var isSameValue = (this.getValue() === value);

				for (var i = 0; i < blocks.length; i++) {
					if (!value || isSameValue) {
						// Remove estilo inline caso selecione (Padrão) ou o mesmo valor
						blocks[i].removeStyle('line-height');
					} else {
						// Aplica o line-height diretamente no bloco pai (compatível com mPDF)
						blocks[i].setStyle('line-height', value);
					}
				}

				this.setValue(!value || isSameValue ? '' : value);
				editor.fire('saveSnapshot');
			},
			onRender: function () {
				var combo = this;
				combo.setValue('');

				editor.on('instanceReady', function () {
					combo.setValue('');
				});

				editor.on('selectionChange', function (ev) {
					var elementPath = ev.data.path;
					var block = elementPath.block || elementPath.blockLimit;
					if (block) {
						var lh = block.getStyle('line-height');
						if (lh) {
							combo.setValue(lh);
							return;
						}
					}
					combo.setValue('');
				}, this);
			}
		});
	}

	CKEDITOR.plugins.add('lineheight', {
		requires: 'richcombo',
		lang: 'en,pt-br',
		init: function (editor) {
			var config = editor.config;
			addCombo(editor, 'lineheight', 'size', editor.lang.lineheight.title, config.line_height, editor.lang.lineheight.title, null, 50);
		}
	});
})();

CKEDITOR.config.line_height = '1;1.15;1.5;2;2.5;3';

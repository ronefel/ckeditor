(function () {
	function getSelectedParagraphs(editor) {
		var selection = editor.getSelection();
		if (!selection) return [];
		var ranges = selection.getRanges();
		var blocks = [];
		var seen = {};

		for (var i = 0; i < ranges.length; i++) {
			var iterator = ranges[i].createIterator();
			var block;
			while ((block = iterator.getNextParagraph())) {
				var id = block.getCustomData('lh_id') || CKEDITOR.tools.getNextId();
				block.setCustomData('lh_id', id);
				if (!seen[id]) {
					seen[id] = true;
					blocks.push(block);
				}
			}
		}

		if (!blocks.length) {
			var start = selection.getStartElement();
			var ascendant = start && (start.is('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'li') ? start : start.getAscendant({ p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, div: 1, li: 1 }, true));
			if (ascendant) {
				blocks.push(ascendant);
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

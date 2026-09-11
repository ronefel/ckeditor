/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see https://ckeditor.com/legal/ckeditor-oss-license
 */
CKEDITOR.editorConfig = function (config) {
	// Define o idioma fixo para Português do Brasil
	config.language = 'pt-br';
	config.defaultLanguage = 'pt-br';

	config.removePlugins = 'exportpdf,scayt,magicline,forms,div';
	config.extraPlugins = 'lineheight,qfields,a4pages,imageresize';
	config.allowedContent = true;

	config.fontSize_sizes = '8/8pt;9/9pt;10/10pt;11/11pt;12/12pt;14/14pt;16/16pt;18/18pt;20/20pt;22/22pt;24/24pt;26/26pt;28/28pt;36/36pt;48/48pt;72/72pt';

	// Desativa a notificação de checagem de versão/segurança (versão não-LTS)
	config.versionCheck = false;

	// Habilita a correção ortográfica nativa do navegador
	config.disableNativeSpellChecker = false;

	// Altura para visualização confortável da folha A4
	config.height = 600;

	config.bodyClass = 'document-contents';

	config.toolbarGroups = [
		{ name: 'styles', groups: ['styles'] },
		{ name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
		{ name: 'colors', groups: ['colors'] },
		{ name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph'] },
		{ name: 'insert', groups: ['insert'] },
		{ name: 'links', groups: ['links'] },
		{ name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing'] },
		{ name: 'clipboard', groups: ['clipboard', 'undo'] },
		{ name: 'tools', groups: ['tools'] },
		{ name: 'others', groups: ['others'] },
		{ name: 'about', groups: ['about'] },
		{ name: 'document', groups: ['mode', 'document', 'doctools'] }
	];

	config.removeButtons = 'Save,NewPage,Print,Templates,Cut,Copy,Paste,PasteText,PasteFromWord,Replace,SelectAll,Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Subscript,Superscript,CreateDiv,BidiLtr,BidiRtl,Language,Anchor,Smiley,SpecialChar,Iframe,Styles,Format,Maximize,About,Link,Unlink,ShowBlocks';
};

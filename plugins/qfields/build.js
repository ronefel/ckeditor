/**
 * Build Script para o QFieldsRenderer
 * Varre dinamicamente a pasta src/fields/ e gera o render_qfields.js minificado.
 * Novos campos adicionados em src/fields/ são detectados automaticamente sem alterar este arquivo!
 * Suporta modo pontual (node build.js) e modo contínuo (node build.js --watch).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = __dirname;
const srcDir = path.join(baseDir, 'src');
const outputFile = path.join(baseDir, 'render_qfields.js');

/**
 * Descobre dinamicamente todos os módulos em src/core e src/fields
 */
function getFilesToBundle() {
    // 1. Módulos do core (garante que registry.js execute antes de renderer.js)
    const coreDir = path.join(srcDir, 'core');
    const coreFiles = fs.readdirSync(coreDir)
        .filter(f => f.endsWith('.js'))
        .sort((a, b) => {
            if (a === 'registry.js') return -1;
            if (b === 'registry.js') return 1;
            return a.localeCompare(b);
        })
        .map(f => path.join(coreDir, f));

    // 2. Varredura dinâmica de todos os campos em src/fields/
    const fieldsDir = path.join(srcDir, 'fields');
    const fieldFiles = fs.readdirSync(fieldsDir)
        .filter(f => f.endsWith('.js'))
        .sort()
        .map(f => path.join(fieldsDir, f));

    // 3. Ponto de entrada final
    const indexFile = path.join(srcDir, 'index.js');

    return {
        allFiles: [...coreFiles, ...fieldFiles, indexFile],
        fieldNames: fieldFiles.map(f => path.basename(f, '.js'))
    };
}

function build() {
    const { allFiles, fieldNames } = getFilesToBundle();

    console.log(`[Build] Campos detectados automaticamente em src/fields/ (${fieldNames.length}): ${fieldNames.join(', ')}`);
    console.log('[Build] Empacotando e minificando render_qfields.js...');

    try {
        const contents = [];

        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            if (!fs.existsSync(file)) {
                throw new Error('Arquivo não encontrado: ' + file);
            }
            let code = fs.readFileSync(file, 'utf8');
            const isLast = (i === allFiles.length - 1);

            // Nos arquivos anteriores ao index.js, remove o module.exports para não sobrescrever o objeto exportado
            if (!isLast) {
                code = code.replace(/if\s*\(\s*typeof\s+module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)\s*\{[\s\S]*?module\.exports\s*=[\s\S]*?\}/g, '');
            }

            contents.push(code.trim());
        }

        const rawBundle = contents.join('\n\n');
        const rawSize = Buffer.byteLength(rawBundle, 'utf8');

        // Minificação direta via Terser via stdin
        let finalCode;
        try {
            finalCode = execSync('npx -y terser --compress --mangle', {
                input: rawBundle,
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024
            });
        } catch (terserErr) {
            console.warn('[Build] Aviso: Falha ao minificar via Terser. Usando código original como fallback.', terserErr.message);
            finalCode = rawBundle;
        }

        fs.writeFileSync(outputFile, finalCode.trim() + '\n', 'utf8');
        const minSize = Buffer.byteLength(finalCode, 'utf8');
        const reduction = ((1 - minSize / rawSize) * 100).toFixed(1);

        console.log(`[Build] Concluído! ${path.basename(outputFile)} gerado com sucesso: ${minSize} bytes (redução de ${reduction}%).`);
    } catch (err) {
        console.error('[Build] Erro durante o processo de build:', err);
    }
}

// Execução inicial
build();

// Modo --watch
if (process.argv.includes('--watch')) {
    console.log(`[Watch] Monitorando alterações em: ${srcDir}...`);
    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.js')) {
            console.log(`[Watch] Arquivo alterado ou adicionado: ${filename}`);
            build();
        }
    });
}

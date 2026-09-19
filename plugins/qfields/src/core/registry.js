/**
 * Registry de Tipos de Campos para o QFieldsRenderer
 * Permite registrar, recuperar e iterar sobre os tipos de campos disponíveis.
 */
var FieldRegistry = (function () {
    'use strict';

    var fields = {};

    function register(typeOrDef, definition) {
        if (!typeOrDef) return;
        if (typeof typeOrDef === 'object' && typeOrDef.type) {
            fields[typeOrDef.type.toLowerCase()] = typeOrDef;
        } else if (typeof typeOrDef === 'string' && definition) {
            fields[typeOrDef.toLowerCase()] = definition;
        }
    }

    function get(type) {
        if (!type) return null;
        return fields[type.toLowerCase()] || null;
    }

    function getAll() {
        return fields;
    }

    return {
        register: register,
        get: get,
        getAll: getAll
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldRegistry;
}

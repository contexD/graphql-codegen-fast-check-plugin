"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_helpers_1 = require("@graphql-codegen/plugin-helpers");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const schema_ast_1 = require("@graphql-codegen/schema-ast");
const typeMapper = {
    "Scalars['Int']": "fc.integer()",
    "Scalars['Float']": "fc.float()",
    "Scalars['String']": "fc.string()",
    "Scalars['Boolean']": "fc.boolean()",
    "Scalars['ID']": "fc.uuid()",
};
module.exports = {
    plugin(schema, documents, config, info) {
        const { ast } = (0, schema_ast_1.transformSchemaAST)(schema, config);
        /*TODO:
       - [x] extract logic into reusable functions
       - [x] try to use capturing group to get what you want immediately (instead of string parsing)
       - [x] add all scalars to type map
       - [x] resolve custom types as well
       - [ ] add typing
       - [ ] add enums
       - [ ] add nullable vs non-nullable
       - [ ] add config (to use array vs set etc)
       - [ ] use config object to customise arbitrary generation
        */
        const getArbitraryVariableName = (name) => `get${name}Arbitrary`;
        const getType = (field) => {
            const type = field.type;
            if (typeMapper[type]) {
                return typeMapper[type];
            }
            else if (type.includes("Array")) {
                const arrayType = type.match(/<(.*)>/);
                return `fc.set(${type.includes("Scalar")
                    ? typeMapper[arrayType[1]]
                    : getArbitraryVariableName(arrayType[1]) + "()"})`;
            }
            else {
                // console.table(field);
                return getArbitraryVariableName(field.name);
            }
        };
        class FastCheckVisitor extends visitor_plugin_common_1.BaseTypesVisitor {
            constructor(schema, pluginConfig, additionalConfig = {}) {
                super(schema, pluginConfig, additionalConfig);
            }
            FieldDefinition(node) {
                console.table(node.type);
                return node.name.value;
            }
            ObjectTypeDefinition(node, key, parent) {
                var _a;
                // console.table(node);
                const arbitraryVariableName = getArbitraryVariableName(node.name);
                return `const ${arbitraryVariableName} = fc.record { 
          ${(_a = node.fields) === null || _a === void 0 ? void 0 : _a.map((f) => {
                    // console.log("typeof", typeof f.type);
                    return `${f.name.toLowerCase()}: ${getType(f)}, 
          `;
                }).join(" ")}}`;
            }
        }
        const visitor = new FastCheckVisitor(schema, config, {});
        const result = (0, plugin_helpers_1.oldVisit)(ast, { leave: visitor });
        return result.definitions.join("\n");
    },
};

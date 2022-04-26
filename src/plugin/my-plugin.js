"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_helpers_1 = require("@graphql-codegen/plugin-helpers");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const schema_ast_1 = require("@graphql-codegen/schema-ast");
const typeMapper = {
    "Scalars['Int']": "fc.integer()",
    "Scalars['String']": "fc.string()",
};
module.exports = {
    plugin(schema, documents, config, info) {
        const { ast } = (0, schema_ast_1.transformSchemaAST)(schema, config);
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
                return `const ${node.name.toLowerCase()}Arbitrary = fc.record { 
          ${(_a = node.fields) === null || _a === void 0 ? void 0 : _a.map((f) => {
                    const type = f.type;
                    const getType = (type) => {
                        if (typeMapper[type]) {
                            return typeMapper[type];
                        }
                        else if (type.includes("Array")) {
                            const arrayType = type.match(/<.*>/);
                            return `fc.set(${arrayType[0]
                                .slice(1, arrayType[0].length - 1)
                                .toLowerCase()}${type.includes("Scalar") ? "" : "Arbitrary"}())`;
                        }
                        else {
                            return f.type;
                        }
                    };
                    // console.table(f.name);
                    // console.log("typeof", typeof f.type);
                    return `${f.name.toLowerCase()}: ${getType(type)}, 
          `;
                }).join(" ")}}`;
            }
        }
        const visitor = new FastCheckVisitor(schema, config, {});
        const result = (0, plugin_helpers_1.oldVisit)(ast, { leave: visitor });
        return result.definitions.join("\n");
    },
};

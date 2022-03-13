"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_helpers_1 = require("@graphql-codegen/plugin-helpers");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const schema_ast_1 = require("@graphql-codegen/schema-ast");
module.exports = {
    plugin(schema, documents, config, info) {
        const { ast } = (0, schema_ast_1.transformSchemaAST)(schema, config);
        class FastCheckVisitor extends visitor_plugin_common_1.BaseTypesVisitor {
            constructor(schema, pluginConfig, additionalConfig = {}) {
                super(schema, pluginConfig, additionalConfig);
            }
            FieldDefinition(node) {
                // console.table(node.type);
                return node.name.value;
            }
            ObjectTypeDefinition(node, key, parent) {
                var _a;
                // console.table(node);
                return `${node.name}\t${(_a = node.fields) === null || _a === void 0 ? void 0 : _a.map((f) => {
                    console.table(f);
                    return f.type;
                }).join(" ")}`;
            }
        }
        const visitor = new FastCheckVisitor(schema, config, {});
        // const visitor = {
        //   FieldDefinition(node: any) {
        //     return node.name.value;
        //   },
        //   ObjectTypeDefinition(node: any) {
        //     return node.fields
        //       .map((field: string) => `${node.name.value}.${field}`)
        //       .join("\n");
        //   },
        // };
        const result = (0, plugin_helpers_1.oldVisit)(ast, { leave: visitor });
        return result.definitions.join("\n");
    },
};

import {
  getCachedDocumentNodeFromSchema,
  oldVisit,
} from "@graphql-codegen/plugin-helpers";
import {
  BaseTypesVisitor,
  RawTypesConfig,
  ParsedTypesConfig,
} from "@graphql-codegen/visitor-plugin-common";
import {
  visit,
  DocumentNode,
  GraphQLSchema,
  ASTVisitor,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  ScalarTypeDefinitionNode,
} from "graphql";
import { transformSchemaAST } from "@graphql-codegen/schema-ast";

module.exports = {
  plugin(schema: GraphQLSchema, documents: any, config: any, info: any) {
    const { ast } = transformSchemaAST(schema, config);

    class FastCheckVisitor extends BaseTypesVisitor {
      constructor(
        schema: GraphQLSchema,
        pluginConfig: RawTypesConfig,
        additionalConfig: Partial<ParsedTypesConfig> = {}
      ) {
        super(schema, pluginConfig, additionalConfig as ParsedTypesConfig);
      }

      FieldDefinition(node: FieldDefinitionNode): string {
        // console.table(node.type);
        return node.name.value;
      }

      ObjectTypeDefinition(
        node: ObjectTypeDefinitionNode,
        key: string | number,
        parent: any
      ): string {
        // console.table(node);
        return `${node.name}\t${node.fields
          ?.map((f) => {
            console.table(f);
            return f.type;
          })
          .join(" ")}`;
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

    const result = oldVisit(ast, { leave: visitor });
    return result.definitions.join("\n");
  },
};

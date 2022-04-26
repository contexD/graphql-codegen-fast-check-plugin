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

const typeMapper: { [index: string]: string } = {
  "Scalars['Int']": "fc.integer()",
  "Scalars['String']": "fc.string()",
};

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
        console.table(node.type);
        return node.name.value;
      }

      ObjectTypeDefinition(
        node: ObjectTypeDefinitionNode,
        key: string | number,
        parent: any
      ): string {
        // console.table(node);
        return `const ${(
          node.name as unknown as string
        ).toLowerCase()}Arbitrary = fc.record { 
          ${node.fields
            ?.map((f) => {
              const type = f.type as unknown as string;

              const getType = (type: string) => {
                if (typeMapper[type]) {
                  return typeMapper[type];
                } else if (type.includes("Array")) {
                  const arrayType = type.match(/<.*>/);
                  return `fc.set(${arrayType![0]
                    .slice(1, arrayType![0].length - 1)
                    .toLowerCase()}${
                    type.includes("Scalar") ? "" : "Arbitrary"
                  }())`;
                } else {
                  return f.type;
                }
              };

              // console.table(f.name);
              // console.log("typeof", typeof f.type);
              return `${(f.name as unknown as string).toLowerCase()}: ${getType(
                type
              )}, 
          `;
            })
            .join(" ")}}`;
      }
    }

    const visitor = new FastCheckVisitor(schema, config, {});

    const result = oldVisit(ast, { leave: visitor });
    return result.definitions.join("\n");
  },
};

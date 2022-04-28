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
  NameNode,
} from "graphql";
import { transformSchemaAST } from "@graphql-codegen/schema-ast";

const typeMapper: { [index: string]: string } = {
  "Scalars['Int']": "fc.integer()",
  "Scalars['Float']": "fc.float()",
  "Scalars['String']": "fc.string()",
  "Scalars['Boolean']": "fc.boolean()",
  "Scalars['ID']": "fc.uuid()",
};

module.exports = {
  plugin(schema: GraphQLSchema, documents: any, config: any, info: any) {
    const { ast } = transformSchemaAST(schema, config);

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
    const getArbitraryVariableName = (name: NameNode | string) =>
      `get${name}Arbitrary`;

    const getType = (field: FieldDefinitionNode) => {
      const type = field.type as unknown as string;
      if (typeMapper[type]) {
        return typeMapper[type];
      } else if (type.includes("Array")) {
        const arrayType = type.match(/<(.*)>/);
        return `fc.set(${
          type.includes("Scalar")
            ? typeMapper[arrayType![1]]
            : getArbitraryVariableName(arrayType![1]) + "()"
        })`;
      } else {
        // console.table(field);
        return getArbitraryVariableName(field.name);
      }
    };

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
        const arbitraryVariableName = getArbitraryVariableName(node.name);
        return `const ${arbitraryVariableName} = fc.record { 
          ${node.fields
            ?.map((f) => {
              // console.log("typeof", typeof f.type);
              return `${(f.name as unknown as string).toLowerCase()}: ${getType(
                f
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

/* eslint-disable func-names */
import {
  model,
  Schema,
  Model,
  DefaultSchemaOptions,
  Document,
  IfAny,
  Require_id,
  SchemaDefinition,
  SchemaDefinitionType,
  ApplySchemaOptions,
  ObtainDocumentType,
  ResolveSchemaOptions,
  SchemaOptions,
} from 'mongoose';

// export type ISchemaDefinition<T = any> =
//   | ObtainDocumentType<any, T, ResolveSchemaOptions<DefaultSchemaOptions>>
//   | SchemaDefinition<SchemaDefinitionType<T>>
//   | undefined;

export type ISchemaOptions<T = any> =
  | ResolveSchemaOptions<DefaultSchemaOptions>
  | SchemaOptions<
      ObtainDocumentType<any, T, ResolveSchemaOptions<DefaultSchemaOptions>>,
      {},
      {},
      {},
      {},
      IfAny<
        ObtainDocumentType<any, T, ResolveSchemaOptions<DefaultSchemaOptions>>,
        any,
        Document<unknown, {}, ObtainDocumentType<any, T, ResolveSchemaOptions<DefaultSchemaOptions>>> &
          Require_id<ObtainDocumentType<any, T, ResolveSchemaOptions<DefaultSchemaOptions>>>
      >
    >
  | undefined;

export const ModelFactory = <
  T,
  TSchemaOptions = DefaultSchemaOptions,
  DocType extends ApplySchemaOptions<
    ObtainDocumentType<DocType, T, ResolveSchemaOptions<TSchemaOptions>>,
    ResolveSchemaOptions<TSchemaOptions>
  > = ApplySchemaOptions<
    ObtainDocumentType<any, T, ResolveSchemaOptions<TSchemaOptions>>,
    ResolveSchemaOptions<TSchemaOptions>
  >,
>(
  modelName: string,
  schemaDefinitions: SchemaDefinition<SchemaDefinitionType<T>, T> | DocType,

  schemaOptions?: ISchemaOptions<T>,
  // schemaOptions,
) => {
  const schema = new Schema<T>(schemaDefinitions, {
    ...schemaOptions,
    // timestamps: true,
  });
  return <Model<T>>model(modelName, schema);
};

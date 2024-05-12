/* eslint-disable func-names */
import {
  model,
  Schema,
  Model,
  DefaultSchemaOptions,
  Document,
  IfAny,
  ObtainDocumentType,
  Require_id,
  ResolveSchemaOptions,
  SchemaDefinition,
  SchemaDefinitionType,
  SchemaOptions,
} from 'mongoose';

export type ISchemaDefinition<T = any> =
  | ObtainDocumentType<any, T, ResolveSchemaOptions<DefaultSchemaOptions>>
  | SchemaDefinition<SchemaDefinitionType<T>>
  | undefined;

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

export const ModelFactory = <T>(
  modelName: string,
  schemaDefinition: ISchemaDefinition<T>,

  schemaOptions?: ISchemaOptions<T>,
) => {
  const schema = new Schema<T>(schemaDefinition, {
    ...schemaOptions,
    timestamps: true,
  });
  return <Model<T>>model(modelName, schema);
};

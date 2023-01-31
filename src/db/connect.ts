import {
  DatabasePool,
  TypeParser,
  createPool,
  createTypeParserPreset,
} from 'slonik';

const timestampParser = (): TypeParser => {
  return {
    name: 'timestamp',
    parse: (value: string | null): Date | null =>
      value ? new Date(value) : null,
  };
};

export const connect = (uri: string): Promise<DatabasePool> => {
  const typeParsers = [...createTypeParserPreset(), timestampParser()];
  return createPool(uri, { typeParsers });
};

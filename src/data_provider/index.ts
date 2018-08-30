import { PhoveaDataProvider } from './PhoveaDataProvider';

export * from './api';

export function dataProviderFactory() {
  return new PhoveaDataProvider();
}

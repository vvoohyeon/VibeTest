import {buildVariantRegistry} from '@/features/variant-registry/builder';
import {getVariantRegistrySourceFixture} from '@/features/variant-registry/source-fixture';

export const variantRegistryGenerated = buildVariantRegistry(getVariantRegistrySourceFixture());

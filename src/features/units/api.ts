import type {
  CreateUnitConversionInput,
  CreateUnitInput,
  Unit,
  UnitConversion,
  UnitListQuery,
  UpdateUnitConversionInput,
  UpdateUnitInput,
} from "../../../electron/shared/types/unit";

type Query = Partial<UnitListQuery>;

export const unitApi = {
  async list(query: Query = {}): Promise<Unit[]> {
    return window.api.unit.list(query);
  },

  async count(
    query: Partial<Pick<UnitListQuery, "search" | "includeDeleted">> = {}
  ): Promise<number> {
    return window.api.unit.count(query);
  },

  async get(id: number): Promise<Unit | null> {
    return window.api.unit.get(id);
  },

  async create(input: CreateUnitInput): Promise<Unit> {
    return window.api.unit.create(input);
  },

  async update(input: UpdateUnitInput): Promise<Unit> {
    return window.api.unit.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.unit.delete(id);
  },

  async restore(id: number): Promise<void> {
    await window.api.unit.restore(id);
  },
};

export const unitConversionApi = {
  async list(filter?: { unitId?: number }): Promise<UnitConversion[]> {
    return window.api.unitConversion.list(filter);
  },

  async create(input: CreateUnitConversionInput): Promise<UnitConversion> {
    return window.api.unitConversion.create(input);
  },

  async update(input: UpdateUnitConversionInput): Promise<UnitConversion> {
    return window.api.unitConversion.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.unitConversion.delete(id);
  },
};
import type {
  CreateUnitInput,
  Unit,
  UnitListQuery,
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
export interface LocationModule {
  id?: number;
  name: string;
  region_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLocation extends Pick<LocationModule, 'name' | 'created_at' | 'region_id'> {};

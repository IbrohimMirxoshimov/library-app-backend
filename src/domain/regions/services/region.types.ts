export interface RegionModule {
  id?: number;
  name: string;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateRegion extends Pick<RegionModule, 'name'> {}
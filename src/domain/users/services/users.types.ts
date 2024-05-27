
export type UserModel = {
  id?: number;
  first_name: string;
  last_name: string;
  location_id: number;
  created_at: Date;
  updated_at: Date;
};

export type UserCreate = Pick<UserModel, 'first_name' | 'last_name' | 'location_id' | 'created_at'>;

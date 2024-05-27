import { IdResponse } from 'app/domain/common';
import { Location } from '../location';
import { LocationModule } from '../service';

export interface LocationRepository {
  create(data: Location): Promise<IdResponse>;
  findByParam(param: Partial<LocationModule>): Promise<LocationModule>;
  findAll(): Promise<LocationModule[] | []>;
}
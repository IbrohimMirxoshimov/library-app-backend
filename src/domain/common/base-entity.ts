
export class BaseEntity<T>{
  protected data!: T & { id: string };

  constructor(data?: T) {
    Object.defineProperty(this, 'data', { value: data })
  }

  public get id() {
    return this.data.id;
  }
}
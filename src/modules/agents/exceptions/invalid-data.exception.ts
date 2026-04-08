import { BadRequestException } from '@nestjs/common';

export class InvalidDataException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = InvalidDataException.name;
  }
}

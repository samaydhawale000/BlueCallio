import { IsString } from 'class-validator';

export class GoogleDto {
  @IsString()
  idToken: string;
}

import { IsInt, IsOptional, IsIn, Min } from 'class-validator';

export class TopUpDto {
  @IsInt()
  @Min(100)
  minutes!: number;

  @IsOptional()
  @IsIn(['INR', 'USD'])
  currency?: string = 'INR';
}

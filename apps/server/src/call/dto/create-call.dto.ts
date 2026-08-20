import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum CallTypeDto {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export class CreateCallDto {
  @IsString()
  callerId: string;

  @IsString()
  receiverId: string;

  @IsEnum(CallTypeDto)
  type: CallTypeDto;

  // Display identity for the call UI (e.g. the incoming-call screen). The
  // integrating app owns its own users — BlueJoinet only transports/shows
  // whatever it's given here, it never looks anyone up.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  callerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  callerAvatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  receiverName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  receiverAvatar?: string;
}
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum IceOutcomeDto {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class WebrtcIceDto {
  @IsEnum(IceOutcomeDto)
  outcome: IceOutcomeDto;

  // Raw RTCIceConnectionState / RTCPeerConnectionState at report time — kept
  // for debugging, not itself used in any aggregate.
  @IsOptional()
  @IsString()
  @MaxLength(32)
  iceConnectionState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  connectionState?: string;
}

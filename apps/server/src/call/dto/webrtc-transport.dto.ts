import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum TransportDto {
  P2P = 'P2P',
  TURN = 'TURN',
}

export class WebrtcTransportDto {
  @IsEnum(TransportDto)
  transport: TransportDto;

  // The raw RTCIceCandidate.type ('host' | 'srflx' | 'prflx' | 'relay') that
  // produced the `transport` classification — kept for debugging, not itself
  // used in any aggregate.
  @IsOptional()
  @IsString()
  @MaxLength(32)
  candidateType?: string;
}

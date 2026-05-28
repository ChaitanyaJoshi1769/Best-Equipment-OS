import { User } from '../../../database/entities';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
  expiresIn: number;
}

export class RefreshTokenDto {
  accessToken: string;
  expiresIn: number;
}

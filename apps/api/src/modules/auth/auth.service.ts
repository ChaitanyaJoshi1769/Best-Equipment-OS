import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, Organization } from '../../database/entities';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, RefreshTokenDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if organization slug exists
    const existingOrg = await this.organizationsService.findBySlug(registerDto.organizationSlug);
    if (existingOrg) {
      throw new BadRequestException('Organization slug already exists');
    }

    // Check if email exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Create organization
    const organization = await this.organizationsService.create({
      name: registerDto.organizationName,
      slug: registerDto.organizationSlug,
      timezone: 'America/New_York',
      status: 'active',
    });

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.usersService.create({
      organizationId: organization.id,
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phoneNumber,
      role: 'owner',
      status: 'active',
      emailVerified: false,
    });

    // Generate tokens
    const tokens = this.generateTokens(user, organization);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
      expiresIn: tokens.expiresIn,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    const organization = await this.organizationsService.findById(user.organizationId);
    const tokens = this.generateTokens(user, organization);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
      expiresIn: tokens.expiresIn,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    if (user.status !== 'active') {
      return null;
    }

    return user;
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      }) as JwtPayload;

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const organization = await this.organizationsService.findById(user.organizationId);
      const roles = await this.usersService.getUserRoles(user.id);

      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          orgId: organization.id,
          roles: roles.map((r) => r.name),
        },
        { expiresIn: this.configService.get('JWT_EXPIRATION') || '24h' },
      );

      return {
        accessToken,
        expiresIn: 86400, // 24 hours in seconds
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: User, organization: Organization) {
    const roles = [user.role]; // Simplified - should be fetched from DB

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: organization.id,
      roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
    };
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

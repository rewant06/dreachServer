import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  async generateJwt(user: any) {
    const payload = {
      sub: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      name: user.name,
    };
    return this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '7d',
    });
  }
}
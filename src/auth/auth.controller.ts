import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;
    const existingUser = await this.userService.createUser(user.email);

    

    // Fetch full user info (including isVerified, role, etc.)
    const fullUser = await this.userService.getUserById(existingUser.userId);
    
    if (!fullUser) {
      return res.redirect(`${process.env.FRONTEND_URL}/error?message=User not found`);
    }

    // Generate JWT
    const jwt = await this.authService.generateJwt(fullUser);

    // Set JWT as HTTP-only cookie
    res.cookie('dreach_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect based on isVerified and role
    if (!fullUser.isVerified) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/complete-profile?userId=${fullUser.userId}`);
    }

    switch (fullUser.role) {
      case 'Doctor':
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/doctor/${fullUser.userId}`);
      case 'Lab':
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/lab/${fullUser.userId}`);
      case 'Hospital':
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/hospital/${fullUser.userId}`);
      // Add more roles as needed
      default:
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/patient/${fullUser.userId}`);
    }
  }
}
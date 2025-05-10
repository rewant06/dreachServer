// filepath: c:\Users\rewan\Desktop\HelpingBots\DreachServer\server\src\auth\auth.controller.ts
import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  HttpStatus,
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
  async googleAuth() {
    // Initiates Google OAuth2 login
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;

    // Check if user exists in the database
    let existingUser = await this.userService.createUser(user.email);
    if (!existingUser) {
      // Create a new user if not found
      existingUser = await this.userService.createUser(user.email);
      await this.userService.updateUsersProfile(
        {
          userId: existingUser.userId,
          name: `${user.firstName} ${user.lastName}`,
          isVerified: true,
        },
        undefined,
      );
    }

    // Store user session
    req.session.user = existingUser;

    // Redirect to role-based dashboard
    if (existingUser.role === 'Doctor') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/doctor`);
    } else if (existingUser.role === 'DoctorsAssistant') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/assistant`);
    }
    else if (existingUser.role === 'Lab') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/lab`);
    }

    else if (existingUser.role === 'Hospital') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/hospital`);
    }

    else {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/patient`);
    }
  }
}
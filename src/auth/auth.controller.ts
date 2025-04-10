import { Body, Controller, Post, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UpdateUserDetailsDto, createUserDto } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';
import { LoginDTO } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { RefreshGuard } from './guard/refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

//   @Post('signup')
//   @HttpCode(HttpStatus.CREATED)
//   async createUser(@Body() dto: createUserDto) {
//     return await this.userService.createUser(dto);
//   }

//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   async login(@Body() dto: LoginDTO) {
//     return await this.authService.login(dto);
//   }

//   @UseGuards(RefreshGuard)
//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   async refreshToken(@Request() request) {
//     return await this.authService.refreshToken(request.user);
//   }
}
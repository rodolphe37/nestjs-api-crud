import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmation.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { DeleteAccountDto } from './dto/deleteAccount.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }
  @Post('reset-password')
  resetPasswordDemand(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPasswordDemand(resetPasswordDto);
  }
  @Post('reset-password-confirmation')
  resetPasswordConfirmation(
    @Body() resetPasswordConfirmatonDto: ResetPasswordConfirmationDto,
  ) {
    return this.authService.resetPasswordConfirmation(
      resetPasswordConfirmatonDto,
    );
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete('delete')
  deleteAccount(
    @Req() request: Request,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    const userId = request.user['userId'];
    return this.authService.deleteAccount(userId, deleteAccountDto);
  }
}

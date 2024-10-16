import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { MailerService } from 'src/mailer/mailer.service';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmation.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async signup(signupDto: SignupDto) {
    const { username, email, password } = signupDto;
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (user) throw new ConflictException('User already exists');
    const hash = await bcrypt.hash(password, 10);
    await this.prismaService.user.create({
      data: {
        email,
        username,
        password: hash,
      },
    });
    await this.mailerService.sendSignupConfirmation(email);
    return { data: 'User succesfully created' };
  }
  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Password does not match');
    }
    const payload = {
      sub: user.userId,
      email: user.email,
    };
    const token = this.jwtService.sign(payload, {
      expiresIn: '2h',
      secret: this.configService.get('SECRET_KEY'),
    });
    return {
      token,
      user: {
        username: user.username,
        email: user.email,
      },
    };
  }
  async resetPasswordDemand(resetPasswordDto: ResetPasswordDto) {
    const { email } = resetPasswordDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const code = speakeasy.totp({
      secret: this.configService.get('OTP_CODE'),
      digits: 5,
      step: 60 * 15,
      encoding: 'base32',
    });
    const url = 'http://localhost:3000/auth/reset-password-confirmation';
    await this.mailerService.sendResetPassword(email, url, code);
    return { data: 'Reset password mail has been sent' };
  }

  async resetPasswordConfirmation(
    resetPasswordConfirmationDto: ResetPasswordConfirmationDto,
  ) {
    const { email, code, password } = resetPasswordConfirmationDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const match = speakeasy.totp.verify({
      secret: this.configService.get('OTP_CODE'),
      token: code,
      digits: 5,
      step: 60 * 15,
      encoding: 'base32',
    });
    if (!match) throw new UnauthorizedException('Invalid/expired token');
    const hash = await bcrypt.hash(password, 10);
    await this.prismaService.user.update({
      where: {
        email,
      },
      data: { password: hash },
    });
    return { data: 'Password updated' };
  }

  async deleteAccount(userId: number, deleteAccountDto: DeleteAccountDto) {
    const { password } = deleteAccountDto;
    const user = await this.prismaService.user.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Password does not match');
    }
    await this.prismaService.user.delete({ where: { userId } });
    return {data: "User succesfully deleted"}
  }
}

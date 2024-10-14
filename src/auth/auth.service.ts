import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signupDto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailerService } from 'src/mailer/mailer.service';
import { SigninDto } from './dto/signinDto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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
}

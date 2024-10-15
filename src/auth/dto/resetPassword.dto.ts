import { IsNotEmpty, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}

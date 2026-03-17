import { IsArray, IsEnum, IsInt, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  roleIds?: number[];

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

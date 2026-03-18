import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Permission } from '../../common/enums/permission.enum';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  @IsInt({ each: true })
  permissionCodes?: Permission[];
}

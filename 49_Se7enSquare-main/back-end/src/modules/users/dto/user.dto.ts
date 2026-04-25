import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppRole } from '../../rbac/role.enum';

export class UserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'player01' })
  username!: string;

  @ApiProperty({ example: 'player@example.com' })
  email!: string;

  @ApiProperty({ enum: AppRole, example: AppRole.USER })
  role!: AppRole;

  @ApiPropertyOptional({ example: 'Casual and competitive gamer' })
  bio?: string;
}

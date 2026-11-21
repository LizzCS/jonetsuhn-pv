import { CreateUserDto } from '../../user/dto/create-user.dto.js';

// Mismos campos y validaciones que POST /users
export class RegisterDto extends CreateUserDto {}

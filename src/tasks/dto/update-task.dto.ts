    // src/tasks/dto/update-task.dto.ts
    import { PartialType } from '@nestjs/mapped-types';
    import { CreateTaskDto } from './create-task.dto';

    // Makes all fields from CreateTaskDto optional for PATCH requests
    export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
    
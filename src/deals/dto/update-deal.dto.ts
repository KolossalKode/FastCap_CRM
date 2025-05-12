        // src/deals/dto/update-deal.dto.ts
        import { PartialType } from '@nestjs/mapped-types';
        import { CreateDealDto } from './create-deal.dto';

        // Makes all fields from CreateDealDto optional for PATCH requests
        export class UpdateDealDto extends PartialType(CreateDealDto) {}
        
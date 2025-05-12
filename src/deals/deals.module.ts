        // src/deals/deals.module.ts
        import { Module } from '@nestjs/common';
        import { DealsService } from './deals.service';
        import { DealsController } from './deals.controller';

        @Module({
          controllers: [DealsController],
          providers: [DealsService],
          // No need to import PrismaModule if it's Global
        })
        export class DealsModule {} // <-- Make sure this line is present
        
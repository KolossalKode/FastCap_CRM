    // src/deals/deals.service.ts
    import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
    import { PrismaService } from '../prisma.service';
    import { CreateDealDto } from './dto/create-deal.dto';
    import { UpdateDealDto } from './dto/update-deal.dto';
    import { Deal, Prisma } from '@prisma/client';
    import { v4 as uuidv4 } from 'uuid'; // <-- Import uuid

    @Injectable()
    export class DealsService {
      constructor(private prisma: PrismaService) {}

      async create(createDealDto: CreateDealDto): Promise<Deal> {
        console.log('SERVICE: Create Deal DTO:', createDealDto);
        const { contactIds, ...dealData } = createDealDto;
        const newDealId = uuidv4(); // <-- Generate UUID here

        try {
          const newDeal = await this.prisma.deal.create({
            data: {
              id: newDealId, // <-- Assign generated ID
              ...dealData, // Spread the basic deal fields (name, stage, value etc.)
              // Handle connecting to existing contacts if contactIds are provided
              ...(contactIds && contactIds.length > 0 && {
                contacts: {
                  connect: contactIds.map((id: string) => ({ id })),
                },
              }),
              // TODO: Handle connecting owner once ownerId is added to DTO/schema
            },
            include: { contacts: true }
          });
          console.log('SERVICE: Successfully created deal:', newDeal.id);
          return newDeal;
        } catch (error) {
          console.error("SERVICE: Error creating deal:", error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              const target = (error.meta?.target as string[])?.join(', ');
              throw new BadRequestException(`Unique constraint failed on field(s): ${target}`);
            }
            if (error.code === 'P2025') {
                 throw new BadRequestException(`Could not create deal: A related record (e.g., Contact) was not found.`);
            }
          }
          throw new InternalServerErrorException("Could not create deal.");
        }
      }

      // --- findAll, findOne, update, remove methods remain the same ---
      async findAll(): Promise<Deal[]> {
        console.log('SERVICE: findAll Deals');
        try {
          return await this.prisma.deal.findMany({
            include: { contacts: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          });
        } catch (error) {
          console.error("SERVICE: Error finding all deals:", error);
          throw new InternalServerErrorException("Could not retrieve deals.");
        }
      }

      async findOne(id: string): Promise<Deal | null> {
        console.log(`SERVICE: findOne Deal: ${id}`);
        try {
          const deal = await this.prisma.deal.findUnique({
            where: { id },
            include: {
              contacts: true,
              notes: { orderBy: { timestamp: 'desc' } },
              submissions: { orderBy: { createdAt: 'desc' } },
              // owner: true,
            },
          });
          if (!deal) {
            throw new NotFoundException(`Deal with ID "${id}" not found`);
          }
          return deal;
        } catch (error) {
          console.error(`SERVICE: Error finding deal ${id}:`, error);
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new InternalServerErrorException("Could not retrieve deal.");
        }
      }

      async update(id: string, updateDealDto: UpdateDealDto): Promise<Deal> {
        console.log(`SERVICE: update Deal ID: ${id}`, updateDealDto);
        const { contactIds, ...dealData } = updateDealDto;

        const dataToUpdate: Prisma.DealUpdateInput = { ...dealData };

        if (contactIds !== undefined) {
            if (contactIds === null || contactIds.length === 0) {
                dataToUpdate.contacts = { set: [] };
            } else {
                dataToUpdate.contacts = {
                    set: contactIds.map((contactId: string) => ({ id: contactId })),
                };
            }
        }
        // TODO: Handle owner update

        if (Object.keys(dataToUpdate).length === 0) {
             console.warn(`SERVICE: Update Deal called for ID ${id} with no data to update.`);
             const existingDeal = await this.findOne(id);
             if (!existingDeal) {
                 throw new NotFoundException(`Deal with ID "${id}" not found.`);
             }
             return existingDeal;
        }

        try {
          return await this.prisma.deal.update({
            where: { id },
            data: dataToUpdate,
             include: { contacts: true }
          });
        } catch (error) {
          console.error(`SERVICE: Error updating deal ${id}:`, error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
              throw new NotFoundException(`Record not found for update or connection (Deal ID: ${id}, potentially related record).`);
            }
            if (error.code === 'P2002') {
              const target = (error.meta?.target as string[])?.join(', ');
              throw new BadRequestException(`Unique constraint failed on field(s): ${target}`);
            }
          }
          throw new InternalServerErrorException("Could not update deal.");
        }
      }

      async remove(id: string): Promise<Deal> {
        console.log(`SERVICE: remove Deal: ${id}`);
        try {
          return await this.prisma.deal.delete({
            where: { id },
          });
        } catch (error) {
          console.error(`SERVICE: Error deleting deal ${id}:`, error);
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundException(`Deal with ID "${id}" not found for deletion`);
          }
          throw new InternalServerErrorException("Could not delete deal.");
        }
      }
    }
    
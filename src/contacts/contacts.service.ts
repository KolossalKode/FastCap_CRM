    // src/contacts/contacts.service.ts
    import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
    import { PrismaService } from '../prisma.service';
    import { CreateContactDto } from './dto/create-contact.dto';
    import { UpdateContactDto } from './dto/update-contact.dto';
    import { Contact, Prisma } from '@prisma/client';
    import { v4 as uuidv4 } from 'uuid'; // <-- Import uuid

    @Injectable()
    export class ContactsService {
      constructor(private prisma: PrismaService) {}

      async create(createContactDto: CreateContactDto): Promise<Contact> {
        console.log('SERVICE: Create Contact DTO:', createContactDto);
        try {
          const tagsData = createContactDto.tags ?? [];
          const ownerIdData = createContactDto.ownerId ?? null;
          const newContactId = uuidv4(); // <-- Generate UUID here

          const newContact = await this.prisma.contact.create({
            data: {
              id: newContactId, // <-- Assign generated ID
              firstName: createContactDto.firstName,
              lastName: createContactDto.lastName,
              email: createContactDto.email,
              phone: createContactDto.phone,
              mobilePhone: createContactDto.mobilePhone,
              officePhone: createContactDto.officePhone,
              otherPhone: createContactDto.otherPhone,
              company: createContactDto.company,
              lead_status: createContactDto.lead_status,
              contactType: createContactDto.contactType,
              businessAddress: createContactDto.businessAddress,
              businessCity: createContactDto.businessCity,
              businessZip: createContactDto.businessZip,
              tags: tagsData,
              ownerId: ownerIdData,
            },
          });
          console.log('SERVICE: Successfully created contact:', newContact.id);
          return newContact;
        } catch (error) {
          console.error("SERVICE: Error creating contact:", error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              const target = (error.meta?.target as string[])?.join(', ');
              throw new BadRequestException(`Unique constraint failed on field(s): ${target}`);
            }
          }
          throw new InternalServerErrorException("Could not create contact.");
        }
      }

      // --- findAll, findOne, update, remove methods remain the same ---
      async findAll(): Promise<Contact[]> {
        console.log('SERVICE: findAll');
        try {
          return await this.prisma.contact.findMany({
            orderBy: {
              lastName: 'asc',
            }
          });
        } catch (error) {
          console.error("SERVICE: Error finding all contacts:", error);
          throw new InternalServerErrorException("Could not retrieve contacts.");
        }
      }

      async search(term: string): Promise<Contact[]> {
        console.log(`SERVICE: search: ${term}`);
        const lowerCaseTerm = term.toLowerCase();
        try {
          return await this.prisma.contact.findMany({
            where: {
              OR: [
                { firstName: { contains: lowerCaseTerm, mode: 'insensitive' } },
                { lastName: { contains: lowerCaseTerm, mode: 'insensitive' } },
                { email: { contains: lowerCaseTerm, mode: 'insensitive' } },
                { company: { contains: lowerCaseTerm, mode: 'insensitive' } },
              ],
            },
            orderBy: {
              lastName: 'asc',
            }
          });
        } catch (error) {
          console.error("SERVICE: Error searching contacts:", error);
          throw new InternalServerErrorException("Could not perform contact search.");
        }
      }

      async findOne(id: string): Promise<Contact | null> {
         console.log(`SERVICE: findOne: ${id}`);
        try {
          const contact = await this.prisma.contact.findUnique({
            where: { id },
            include: {
              notes: { orderBy: { timestamp: 'desc'} },
              deals: true,
              owner: { select: { id: true, name: true, role: true }}
            }
          });
          if (!contact) {
            throw new NotFoundException(`Contact with ID "${id}" not found`);
          }
          return contact;
        } catch (error) {
          console.error(`SERVICE: Error finding contact ${id}:`, error);
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new InternalServerErrorException("Could not retrieve contact.");
        }
      }

      async update(id: string, updateContactDto: UpdateContactDto): Promise<Contact> {
        console.log(`SERVICE: update ID: ${id}`, updateContactDto);

        const dataToUpdate: Prisma.ContactUpdateInput = {};

        if (updateContactDto.firstName !== undefined) dataToUpdate.firstName = updateContactDto.firstName;
        if (updateContactDto.lastName !== undefined) dataToUpdate.lastName = updateContactDto.lastName;
        if (updateContactDto.email !== undefined) dataToUpdate.email = updateContactDto.email;
        if (updateContactDto.phone !== undefined) dataToUpdate.phone = updateContactDto.phone;
        if (updateContactDto.mobilePhone !== undefined) dataToUpdate.mobilePhone = updateContactDto.mobilePhone;
        if (updateContactDto.officePhone !== undefined) dataToUpdate.officePhone = updateContactDto.officePhone;
        if (updateContactDto.otherPhone !== undefined) dataToUpdate.otherPhone = updateContactDto.otherPhone;
        if (updateContactDto.company !== undefined) dataToUpdate.company = updateContactDto.company;
        if (updateContactDto.tags !== undefined) dataToUpdate.tags = Array.isArray(updateContactDto.tags) ? updateContactDto.tags : [];
        if (updateContactDto.lead_status !== undefined) dataToUpdate.lead_status = updateContactDto.lead_status;
        if (updateContactDto.contactType !== undefined) dataToUpdate.contactType = updateContactDto.contactType;
        if (updateContactDto.businessAddress !== undefined) dataToUpdate.businessAddress = updateContactDto.businessAddress;
        if (updateContactDto.businessCity !== undefined) dataToUpdate.businessCity = updateContactDto.businessCity;
        if (updateContactDto.businessZip !== undefined) dataToUpdate.businessZip = updateContactDto.businessZip;
        if (updateContactDto.ownerId !== undefined) {
          dataToUpdate.owner = updateContactDto.ownerId === '' || updateContactDto.ownerId === null
            ? { disconnect: true }
            : { connect: { id: updateContactDto.ownerId } };
        }


        if (Object.keys(dataToUpdate).length === 0) {
          console.warn(`SERVICE: Update Contact called for ID ${id} with no data to update.`);
          const existingContact = await this.findOne(id);
          if (!existingContact) {
              throw new NotFoundException(`Contact with ID "${id}" not found.`);
          }
          return existingContact;
        }

        try {
          return await this.prisma.contact.update({
            where: { id },
            data: dataToUpdate,
             include: { owner: true } // Include owner in response if needed
          });
        } catch (error) {
          console.error(`SERVICE: Error updating contact ${id}:`, error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2025') {
                  throw new NotFoundException(`Record not found for update or connection (Contact ID: ${id}, potentially related User ID).`);
              }
              if (error.code === 'P2002') {
                  const target = (error.meta?.target as string[])?.join(', ');
                  throw new BadRequestException(`Unique constraint failed on field(s): ${target}`);
              }
          }
          throw new InternalServerErrorException("Could not update contact.");
        }
      }


      async remove(id: string): Promise<Contact> {
        console.log(`SERVICE: remove: ${id}`);
        try {
          const contact = await this.prisma.contact.delete({
            where: { id },
          });
          console.log(`SERVICE: Successfully deleted contact: ${id}`);
          return contact;
        } catch (error) {
          console.error(`SERVICE: Error deleting contact ${id}:`, error);
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundException(`Contact with ID "${id}" not found for deletion`);
          }
          throw new InternalServerErrorException("Could not delete contact.");
        }
      }
    }
    
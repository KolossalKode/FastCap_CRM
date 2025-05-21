import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Submission, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    const newId = uuidv4();
    const {
      lender_name,
      submission_date,
      status,
      approval_date,
      approval_amount,
      approval_term,
      approval_rate,
      stipulations,
      approval_link,
      decline_reason,
      dealId,
    } = createSubmissionDto;

    try {
      const submission = await this.prisma.submission.create({
        data: {
          id: newId,
          lender_name,
          submission_date: submission_date ? new Date(submission_date) : undefined,
          status,
          approval_date: approval_date ? new Date(approval_date) : undefined,
          approval_amount,
          approval_term,
          approval_rate,
          stipulations,
          approval_link,
          decline_reason,
          deal: { connect: { id: dealId } },
        },
        include: { deal: true },
      });
      return submission;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException('Related deal not found');
      }
      throw new InternalServerErrorException('Could not create submission');
    }
  }

  async findAll(): Promise<Submission[]> {
    try {
      return await this.prisma.submission.findMany({
        include: { deal: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Could not retrieve submissions');
    }
  }

  async findOne(id: string): Promise<Submission> {
    try {
      const submission = await this.prisma.submission.findUnique({
        where: { id },
        include: { deal: true },
      });
      if (!submission) {
        throw new NotFoundException(`Submission with ID "${id}" not found`);
      }
      return submission;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not retrieve submission');
    }
  }

  async update(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission> {
    const {
      lender_name,
      submission_date,
      status,
      approval_date,
      approval_amount,
      approval_term,
      approval_rate,
      stipulations,
      approval_link,
      decline_reason,
      dealId,
    } = updateSubmissionDto;

    const data: Prisma.SubmissionUpdateInput = {};
    if (lender_name !== undefined) data.lender_name = lender_name;
    if (submission_date !== undefined)
      data.submission_date = submission_date ? new Date(submission_date) : null;
    if (status !== undefined) data.status = status;
    if (approval_date !== undefined)
      data.approval_date = approval_date ? new Date(approval_date) : null;
    if (approval_amount !== undefined) data.approval_amount = approval_amount;
    if (approval_term !== undefined) data.approval_term = approval_term;
    if (approval_rate !== undefined) data.approval_rate = approval_rate;
    if (stipulations !== undefined) data.stipulations = stipulations;
    if (approval_link !== undefined) data.approval_link = approval_link;
    if (decline_reason !== undefined) data.decline_reason = decline_reason;
    if (dealId !== undefined) {
      data.deal = { connect: { id: dealId } };
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      return await this.prisma.submission.update({
        where: { id },
        data,
        include: { deal: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Submission with ID "${id}" not found`);
      }
      throw new InternalServerErrorException('Could not update submission');
    }
  }

  async remove(id: string): Promise<Submission> {
    try {
      return await this.prisma.submission.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Submission with ID "${id}" not found`);
      }
      throw new InternalServerErrorException('Could not delete submission');
    }
  }
}

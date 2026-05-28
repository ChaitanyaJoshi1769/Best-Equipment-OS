import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../database/entities';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async create(organizationData: Partial<Organization>): Promise<Organization> {
    const organization = this.organizationsRepository.create(organizationData);
    return this.organizationsRepository.save(organization);
  }

  async findById(id: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['users', 'roles'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.organizationsRepository.findOne({
      where: { slug },
      relations: ['users', 'roles'],
    });
  }

  async findAll(skip = 0, take = 10): Promise<[Organization[], number]> {
    return this.organizationsRepository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, organizationData: Partial<Organization>): Promise<Organization> {
    const organization = await this.findById(id);

    // Prevent slug changes
    if (organizationData.slug && organizationData.slug !== organization.slug) {
      throw new BadRequestException('Cannot change organization slug');
    }

    Object.assign(organization, organizationData);
    return this.organizationsRepository.save(organization);
  }

  async delete(id: string): Promise<void> {
    const organization = await this.findById(id);
    await this.organizationsRepository.softDelete(id);
  }

  async restore(id: string): Promise<Organization> {
    await this.organizationsRepository.restore(id);
    return this.findById(id);
  }

  async getStats(id: string) {
    const organization = await this.findById(id);
    return {
      id: organization.id,
      name: organization.name,
      userCount: organization.users?.length || 0,
      roleCount: organization.roles?.length || 0,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}

import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export async function contactRoutes(fastify: FastifyInstance) {
  /**
   * GET /contacts
   * Get all contacts for authenticated user with optional filtering
   */
  fastify.get<{
    Querystring: {
      search?: string;
      syncStatus?: 'pending' | 'synced' | 'error';
      page?: string;
      limit?: string;
    };
  }>(
    '/contacts',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { search, syncStatus, page = '1', limit = '50' } = request.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {
          userId: request.currentUser.id,
        };

        // Add search filter if provided
        if (search) {
          where.OR = [
            { fullName: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Add sync status filter if provided
        if (syncStatus) {
          where.syncStatus = syncStatus;
        }

        const [contacts, total] = await Promise.all([
          prisma.contact.findMany({
            where,
            include: {
              tasks: {
                select: {
                  id: true,
                  title: true,
                  completed: true,
                  dueDate: true,
                },
                orderBy: { dueDate: 'asc' },
              },
            },
            orderBy: { fullName: 'asc' },
            skip,
            take: limitNum,
          }),
          prisma.contact.count({ where }),
        ]);

        return {
          contacts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        };
      } catch (error) {
        fastify.log.error({ error }, 'Get contacts error');
        return reply.code(500).send({
          error: 'Failed to get contacts',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /contacts/:id
   * Get a specific contact with all related tasks
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/contacts/:id',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const contactId = parseInt(request.params.id, 10);

        if (isNaN(contactId)) {
          return reply.code(400).send({ error: 'Invalid contact ID' });
        }

        const contact = await prisma.contact.findFirst({
          where: {
            id: contactId,
            userId: request.currentUser.id, // Ensure user owns the contact
          },
          include: {
            tasks: {
              orderBy: { dueDate: 'asc' },
            },
          },
        });

        if (!contact) {
          return reply.code(404).send({ error: 'Contact not found' });
        }

        return { contact };
      } catch (error) {
        fastify.log.error({ error }, 'Get contact error');
        return reply.code(500).send({
          error: 'Failed to get contact',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /contacts
   * Create a new contact
   */
  fastify.post<{
    Body: {
      firstName?: string;
      lastName?: string;
      fullName: string;
      phone?: string;
      email?: string;
      address?: string;
      company?: string;
      notes?: string;
      deviceContactId?: string;
    };
  }>(
    '/contacts',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['fullName'],
          properties: {
            firstName: { type: 'string', maxLength: 100 },
            lastName: { type: 'string', maxLength: 100 },
            fullName: { type: 'string', minLength: 1, maxLength: 200 },
            phone: { type: 'string', maxLength: 50 },
            email: { type: 'string', format: 'email', maxLength: 255 },
            address: { type: 'string', maxLength: 500 },
            company: { type: 'string', maxLength: 200 },
            notes: { type: 'string', maxLength: 2000 },
            deviceContactId: { type: 'string', maxLength: 255 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const {
          firstName,
          lastName,
          fullName,
          phone,
          email,
          address,
          company,
          notes,
          deviceContactId,
        } = request.body;

        // Check for duplicate phone or email
        if (phone || email) {
          const existingContact = await prisma.contact.findFirst({
            where: {
              userId: request.currentUser.id,
              OR: [
                phone ? { phone } : {},
                email ? { email } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          });

          if (existingContact) {
            return reply.code(409).send({
              error: 'Contact with this phone or email already exists',
            });
          }
        }

        const contact = await prisma.contact.create({
          data: {
            firstName,
            lastName,
            fullName,
            phone,
            email,
            address,
            company,
            notes,
            deviceContactId,
            syncStatus: deviceContactId ? 'synced' : 'pending',
            lastSynced: deviceContactId ? new Date() : null,
            userId: request.currentUser.id,
          },
          include: {
            tasks: true,
          },
        });

        return reply.code(201).send({ contact });
      } catch (error) {
        fastify.log.error({ error }, 'Create contact error');
        return reply.code(500).send({
          error: 'Failed to create contact',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * PATCH /contacts/:id
   * Update a contact
   */
  fastify.patch<{
    Params: { id: string };
    Body: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      phone?: string;
      email?: string;
      address?: string;
      company?: string;
      notes?: string;
      deviceContactId?: string;
      syncStatus?: 'pending' | 'synced' | 'error';
    };
  }>(
    '/contacts/:id',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string', maxLength: 100 },
            lastName: { type: 'string', maxLength: 100 },
            fullName: { type: 'string', minLength: 1, maxLength: 200 },
            phone: { type: 'string', maxLength: 50 },
            email: { type: 'string', format: 'email', maxLength: 255 },
            address: { type: 'string', maxLength: 500 },
            company: { type: 'string', maxLength: 200 },
            notes: { type: 'string', maxLength: 2000 },
            deviceContactId: { type: 'string', maxLength: 255 },
            syncStatus: { type: 'string', enum: ['pending', 'synced', 'error'] },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const contactId = parseInt(request.params.id, 10);

        if (isNaN(contactId)) {
          return reply.code(400).send({ error: 'Invalid contact ID' });
        }

        // Check if contact exists and belongs to user
        const existingContact = await prisma.contact.findFirst({
          where: {
            id: contactId,
            userId: request.currentUser.id,
          },
        });

        if (!existingContact) {
          return reply.code(404).send({ error: 'Contact not found' });
        }

        // Check for duplicate phone or email (excluding current contact)
        const { phone, email } = request.body;
        if (phone || email) {
          const duplicateContact = await prisma.contact.findFirst({
            where: {
              userId: request.currentUser.id,
              id: { not: contactId },
              OR: [
                phone ? { phone } : {},
                email ? { email } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          });

          if (duplicateContact) {
            return reply.code(409).send({
              error: 'Another contact with this phone or email already exists',
            });
          }
        }

        // Prepare update data
        const updateData: any = { ...request.body };

        // Update lastSynced if deviceContactId is being set
        if (updateData.deviceContactId && !existingContact.deviceContactId) {
          updateData.lastSynced = new Date();
          updateData.syncStatus = 'synced';
        }

        // Update contact
        const contact = await prisma.contact.update({
          where: { id: contactId },
          data: updateData,
          include: {
            tasks: true,
          },
        });

        return { contact };
      } catch (error) {
        fastify.log.error({ error }, 'Update contact error');
        return reply.code(500).send({
          error: 'Failed to update contact',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * DELETE /contacts/:id
   * Delete a contact
   */
  fastify.delete<{
    Params: { id: string };
  }>(
    '/contacts/:id',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const contactId = parseInt(request.params.id, 10);

        if (isNaN(contactId)) {
          return reply.code(400).send({ error: 'Invalid contact ID' });
        }

        // Check if contact exists and belongs to user
        const existingContact = await prisma.contact.findFirst({
          where: {
            id: contactId,
            userId: request.currentUser.id,
          },
          include: {
            tasks: true,
          },
        });

        if (!existingContact) {
          return reply.code(404).send({ error: 'Contact not found' });
        }

        // Check if contact has associated tasks
        if (existingContact.tasks.length > 0) {
          return reply.code(400).send({
            error: 'Cannot delete contact with associated tasks',
            details: `This contact has ${existingContact.tasks.length} task(s). Please remove or reassign them first.`,
          });
        }

        // Delete contact
        await prisma.contact.delete({
          where: { id: contactId },
        });

        return { message: 'Contact deleted successfully' };
      } catch (error) {
        fastify.log.error({ error }, 'Delete contact error');
        return reply.code(500).send({
          error: 'Failed to delete contact',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * PATCH /contacts/:id/sync
   * Update contact sync status
   */
  fastify.patch<{
    Params: { id: string };
    Body: {
      deviceContactId?: string;
      syncStatus: 'pending' | 'synced' | 'error';
      errorMessage?: string;
    };
  }>(
    '/contacts/:id/sync',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['syncStatus'],
          properties: {
            deviceContactId: { type: 'string', maxLength: 255 },
            syncStatus: { type: 'string', enum: ['pending', 'synced', 'error'] },
            errorMessage: { type: 'string', maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const contactId = parseInt(request.params.id, 10);

        if (isNaN(contactId)) {
          return reply.code(400).send({ error: 'Invalid contact ID' });
        }

        // Check if contact exists and belongs to user
        const existingContact = await prisma.contact.findFirst({
          where: {
            id: contactId,
            userId: request.currentUser.id,
          },
        });

        if (!existingContact) {
          return reply.code(404).send({ error: 'Contact not found' });
        }

        const { deviceContactId, syncStatus, errorMessage } = request.body;

        // Update sync status
        const contact = await prisma.contact.update({
          where: { id: contactId },
          data: {
            deviceContactId: deviceContactId || existingContact.deviceContactId,
            syncStatus,
            lastSynced: syncStatus === 'synced' ? new Date() : existingContact.lastSynced,
            notes: errorMessage
              ? `${existingContact.notes || ''}\n[Sync Error: ${errorMessage}]`.trim()
              : existingContact.notes,
          },
        });

        return { contact };
      } catch (error) {
        fastify.log.error({ error }, 'Update contact sync status error');
        return reply.code(500).send({
          error: 'Failed to update contact sync status',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /contacts/search/phone
   * Search for a contact by phone number
   */
  fastify.get<{
    Querystring: {
      phone: string;
    };
  }>(
    '/contacts/search/phone',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { phone } = request.query;

        if (!phone) {
          return reply.code(400).send({ error: 'Phone number is required' });
        }

        const contact = await prisma.contact.findFirst({
          where: {
            userId: request.currentUser.id,
            phone,
          },
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                completed: true,
                dueDate: true,
              },
            },
          },
        });

        return { contact: contact || null };
      } catch (error) {
        fastify.log.error({ error }, 'Search contact by phone error');
        return reply.code(500).send({
          error: 'Failed to search contact',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}

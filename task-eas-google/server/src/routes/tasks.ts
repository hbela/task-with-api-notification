import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export async function taskRoutes(fastify: FastifyInstance) {
  /**
   * GET /tasks
   * Get all tasks for authenticated user with optional filtering
   */
  fastify.get<{
    Querystring: {
      status?: 'pending' | 'completed';
      page?: string;
      limit?: string;
    };
  }>(
    '/tasks',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { status } = request.query;

        // Build where clause
        const where: any = {
          userId: request.currentUser.id,
        };

        // Add status filter if provided
        if (status === 'completed') {
          where.completed = true;
        } else if (status === 'pending') {
          where.completed = false;
        }

        const tasks = await prisma.task.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return { tasks };
      } catch (error) {
        fastify.log.error({ error }, 'Get tasks error');
        return reply.code(500).send({
          error: 'Failed to get tasks',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /tasks/:id
   * Get a specific task
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/tasks/:id',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const taskId = parseInt(request.params.id, 10);

        if (isNaN(taskId)) {
          return reply.code(400).send({ error: 'Invalid task ID' });
        }

        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId: request.currentUser.id, // Ensure user owns the task
          },
        });

        if (!task) {
          return reply.code(404).send({ error: 'Task not found' });
        }

        return { task };
      } catch (error) {
        fastify.log.error({ error }, 'Get task error');
        return reply.code(500).send({
          error: 'Failed to get task',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /tasks
   * Create a new task
   */
  fastify.post<{
    Body: {
      title: string;
      description?: string;
      completed?: boolean;
      priority?: string;
      dueDate?: string;
      notificationId?: string;
    };
  }>(
    '/tasks',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', maxLength: 1000 },
            completed: { type: 'boolean' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            dueDate: { type: 'string', format: 'date-time' },
            notificationId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { title, description, completed, priority, dueDate, notificationId } = request.body;

        const task = await prisma.task.create({
          data: {
            title,
            description,
            completed: completed || false,
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            notificationId,
            userId: request.currentUser.id,
          },
        });

        return reply.code(201).send({ task });
      } catch (error) {
        fastify.log.error({ error }, 'Create task error');
        return reply.code(500).send({
          error: 'Failed to create task',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * PATCH /tasks/:id
   * Update a task
   */
  fastify.patch<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      completed?: boolean;
      priority?: string;
      dueDate?: string;
      notificationId?: string;
    };
  }>(
    '/tasks/:id',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', maxLength: 1000 },
            completed: { type: 'boolean' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            dueDate: { type: 'string', format: 'date-time' },
            notificationId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const taskId = parseInt(request.params.id, 10);

        if (isNaN(taskId)) {
          return reply.code(400).send({ error: 'Invalid task ID' });
        }

        // Check if task exists and belongs to user
        const existingTask = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId: request.currentUser.id,
          },
        });

        if (!existingTask) {
          return reply.code(404).send({ error: 'Task not found' });
        }

        // Prepare update data
        const updateData: any = { ...request.body };
        
        // Convert dueDate string to Date if provided
        if (updateData.dueDate !== undefined) {
          updateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
        }

        // Update task
        const task = await prisma.task.update({
          where: { id: taskId },
          data: updateData,
        });

        return { task };
      } catch (error) {
        fastify.log.error({ error }, 'Update task error');
        return reply.code(500).send({
          error: 'Failed to update task',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * DELETE /tasks/:id
   * Delete a task
   */
  fastify.delete<{
    Params: { id: string };
  }>(
    '/tasks/:id',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const taskId = parseInt(request.params.id, 10);

        if (isNaN(taskId)) {
          return reply.code(400).send({ error: 'Invalid task ID' });
        }

        // Check if task exists and belongs to user
        const existingTask = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId: request.currentUser.id,
          },
        });

        if (!existingTask) {
          return reply.code(404).send({ error: 'Task not found' });
        }

        // Delete task
        await prisma.task.delete({
          where: { id: taskId },
        });

        return { message: 'Task deleted successfully' };
      } catch (error) {
        fastify.log.error({ error }, 'Delete task error');
        return reply.code(500).send({
          error: 'Failed to delete task',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}

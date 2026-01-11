import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export async function taskRoutes(fastify: FastifyInstance) {
  /**
   * GET /tasks
   * Get all tasks for authenticated user
   */
  fastify.get(
    '/tasks',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const tasks = await prisma.task.findMany({
          where: { userId: request.currentUser.id },
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
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { title, description, completed } = request.body;

        const task = await prisma.task.create({
          data: {
            title,
            description,
            completed: completed || false,
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

        // Update task
        const task = await prisma.task.update({
          where: { id: taskId },
          data: request.body,
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

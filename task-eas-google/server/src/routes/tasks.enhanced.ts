import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export async function taskRoutes(fastify: FastifyInstance) {
  /**
   * GET /tasks
   * Get all tasks for authenticated user with pagination and filtering
   */
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      status?: 'all' | 'pending' | 'completed';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      sortBy?: 'createdAt' | 'dueDate' | 'priority';
      sortOrder?: 'asc' | 'desc';
    };
  }>(
    '/tasks',
    {
      preHandler: [authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            status: { type: 'string', enum: ['all', 'pending', 'completed'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            sortBy: { type: 'string', enum: ['createdAt', 'dueDate', 'priority'] },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        // Parse pagination parameters
        const page = parseInt(request.query.page || '1', 10);
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 100); // Max 100 items
        const status = request.query.status;
        const priority = request.query.priority;
        const sortBy = request.query.sortBy || 'createdAt';
        const sortOrder = request.query.sortOrder || 'desc';

        // Validate pagination
        if (page < 1 || limit < 1) {
          return reply.code(400).send({
            error: 'Invalid pagination parameters',
            code: 'INVALID_PAGINATION',
          });
        }

        // Build where clause
        const where: any = { userId: request.currentUser.id };
        
        if (status === 'completed') {
          where.completed = true;
        } else if (status === 'pending') {
          where.completed = false;
        }
        
        if (priority) {
          where.priority = priority;
        }

        // Get total count for pagination metadata
        const total = await prisma.task.count({ where });

        // Get paginated tasks with sorting
        const tasks = await prisma.task.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        });

        // Return with pagination metadata
        return {
          tasks,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error({ error }, 'Get tasks error');
        return reply.code(500).send({
          error: 'Failed to get tasks',
          code: 'GET_TASKS_FAILED',
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
          return reply.code(401).send({
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        const taskId = parseInt(request.params.id, 10);

        if (isNaN(taskId)) {
          return reply.code(400).send({
            error: 'Invalid task ID',
            code: 'INVALID_TASK_ID',
          });
        }

        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId: request.currentUser.id, // Ensure user owns the task
          },
        });

        if (!task) {
          return reply.code(404).send({
            error: 'Task not found',
            code: 'TASK_NOT_FOUND',
          });
        }

        return { task };
      } catch (error) {
        fastify.log.error({ error }, 'Get task error');
        return reply.code(500).send({
          error: 'Failed to get task',
          code: 'GET_TASK_FAILED',
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
          },
      },
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        const { title, description, completed, priority, dueDate } = request.body;

        const task = await prisma.task.create({
          data: {
            title: title.trim(),
            description: description?.trim() || null,
            completed: completed || false,
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            userId: request.currentUser.id,
          },
        });

        return reply.code(201).send({ task });
      } catch (error) {
        fastify.log.error({ error }, 'Create task error');
        return reply.code(500).send({
          error: 'Failed to create task',
          code: 'CREATE_TASK_FAILED',
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
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        const taskId = parseInt(request.params.id, 10);

        if (isNaN(taskId)) {
          return reply.code(400).send({
            error: 'Invalid task ID',
            code: 'INVALID_TASK_ID',
          });
        }

        // Check if task exists and belongs to user
        const existingTask = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId: request.currentUser.id,
          },
        });

        if (!existingTask) {
          return reply.code(404).send({
            error: 'Task not found',
            code: 'TASK_NOT_FOUND',
          });
        }

        // Prepare update data
        const updateData: any = {};
        if (request.body.title !== undefined) {
          updateData.title = request.body.title.trim();
        }
        if (request.body.description !== undefined) {
          updateData.description = request.body.description?.trim() || null;
        }
        if (request.body.completed !== undefined) {
          updateData.completed = request.body.completed;
        }
        if (request.body.priority !== undefined) {
          updateData.priority = request.body.priority;
        }
        if (request.body.dueDate !== undefined) {
          updateData.dueDate = request.body.dueDate ? new Date(request.body.dueDate) : null;
        }
        if (request.body.notificationId !== undefined) {
          updateData.notificationId = request.body.notificationId;
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
          code: 'UPDATE_TASK_FAILED',
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
          return reply.code(401).send({
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        const taskId = parseInt(request.params.id, 10);

        if (isNaN(taskId)) {
          return reply.code(400).send({
            error: 'Invalid task ID',
            code: 'INVALID_TASK_ID',
          });
        }

        // Check if task exists and belongs to user
        const existingTask = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId: request.currentUser.id,
          },
        });

        if (!existingTask) {
          return reply.code(404).send({
            error: 'Task not found',
            code: 'TASK_NOT_FOUND',
          });
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
          code: 'DELETE_TASK_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}

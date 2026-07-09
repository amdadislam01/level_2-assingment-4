import { prisma } from '../config/prisma.js';

export const getAllServices = async (req, res, next) => {
  try {
    const { categoryId, location, minRating, minPrice, maxPrice, search } = req.query;

    const filter = {};

    // Filter by service category
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Filter by pricing range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filter.price.lte = parseFloat(maxPrice);
      }
    }

    // Filter by technician location or rating
    if (location || minRating) {
      filter.technician = {};
      if (location) {
        filter.technician.location = {
          contains: location,
          mode: 'insensitive',
        };
      }
      if (minRating) {
        filter.technician.rating = {
          gte: parseFloat(minRating),
        };
      }
    }

    // Keyword search in service name or description
    if (search) {
      filter.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const services = await prisma.service.findMany({
      where: filter,
      include: {
        category: true,
        technician: {
          include: {
            user: {
              select: { name: true, email: true, isBanned: true },
            },
          },
        },
      },
    });

    // Don't return services offered by banned technicians
    const activeServices = services.filter(
      (service) => !service.technician.user.isBanned
    );

    res.status(200).json({
      success: true,
      results: activeServices.length,
      data: { services: activeServices },
    });
  } catch (error) {
    next(error);
  }
};

export const getService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        technician: {
          include: {
            user: {
              select: { name: true, email: true, isBanned: true },
            },
          },
        },
      },
    });

    if (!service || service.technician.user.isBanned) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        errorDetails: `No service matches the ID ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { name, description, price, categoryId } = req.body;

    // Check if user is a technician with a profile
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Technician profile missing',
        errorDetails: 'You must complete a Technician Profile before creating services.',
      });
    }

    const newService = await prisma.service.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        technicianId: profile.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: { service: newService },
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId } = req.body;

    // Fetch existing service
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        errorDetails: `No service matches the ID ${id}`,
      });
    }

    // Verify ownership (or admin status)
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (req.user.role !== 'ADMIN' && (!profile || service.technicianId !== profile.id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        errorDetails: 'You do not have permission to edit this service.',
      });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        categoryId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      data: { service: updatedService },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        errorDetails: `No service matches the ID ${id}`,
      });
    }

    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (req.user.role !== 'ADMIN' && (!profile || service.technicianId !== profile.id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        errorDetails: 'You do not have permission to delete this service.',
      });
    }

    await prisma.service.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response } from 'express';
import { categoryService } from './category.service';
import { ApiResponse } from '../../utils/apiResponse';

export class CategoryController {
  async list(req: Request, res: Response): Promise<Response> {
    const data = await categoryService.list(req.query as Record<string, string>);
    return ApiResponse.success(res, data);
  }

  async adminList(_req: Request, res: Response): Promise<Response> {
    const data = await categoryService.adminList();
    return ApiResponse.success(res, data);
  }

  async getBySlug(req: Request, res: Response): Promise<Response> {
    const data = await categoryService.getBySlug(req.params.slug);
    return ApiResponse.success(res, data);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const data = await categoryService.getById(req.params.id);
    return ApiResponse.success(res, data);
  }

  async create(req: Request, res: Response): Promise<Response> {
    const data = await categoryService.create(req.body);
    return ApiResponse.created(res, data, 'Category created');
  }

  async update(req: Request, res: Response): Promise<Response> {
    const data = await categoryService.update(req.params.id, req.body);
    return ApiResponse.success(res, data, 'Category updated');
  }

  async remove(req: Request, res: Response): Promise<Response> {
    await categoryService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Category deleted');
  }
}

export const categoryController = new CategoryController();

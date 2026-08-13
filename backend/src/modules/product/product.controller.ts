import { Request, Response } from 'express';
import { productService } from './product.service';
import { ApiResponse } from '../../utils/apiResponse';

export class ProductController {
  async list(req: Request, res: Response): Promise<Response> {
    const { items, total, page, limit } = await productService.list(req.query as never);
    return ApiResponse.paginated(res, items, page, limit, total);
  }

  async adminList(req: Request, res: Response): Promise<Response> {
    const { items, total, page, limit } = await productService.adminList(req.query as never);
    return ApiResponse.paginated(res, items, page, limit, total);
  }

  async getBySlug(req: Request, res: Response): Promise<Response> {
    const data = await productService.getBySlug(req.params.slug);
    return ApiResponse.success(res, data);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const data = await productService.getById(req.params.id);
    return ApiResponse.success(res, data);
  }

  async create(req: Request, res: Response): Promise<Response> {
    const data = await productService.create(req.body);
    return ApiResponse.created(res, data, 'Product created');
  }

  async update(req: Request, res: Response): Promise<Response> {
    const data = await productService.update(req.params.id, req.body);
    return ApiResponse.success(res, data, 'Product updated');
  }

  async archive(req: Request, res: Response): Promise<Response> {
    const data = await productService.archive(req.params.id);
    return ApiResponse.success(res, data, 'Product archived');
  }

  async restore(req: Request, res: Response): Promise<Response> {
    const data = await productService.restore(req.params.id);
    return ApiResponse.success(res, data, 'Product restored');
  }

  async remove(req: Request, res: Response): Promise<Response> {
    await productService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Product deleted');
  }
}

export const productController = new ProductController();

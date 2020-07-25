import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import { response } from 'express';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const foundProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    return foundProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productIds = products.map(product => product.id);

    /* const foundProducts = await this.ormRepository.findByIds(productIds); */
    const foundProducts = await this.ormRepository.find({
      where: {
        id: In(productIds),
      },
    });

    return foundProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    /*
    const { id, quantity } = products;

    const ids = products.map(product => product.id);
    const foundProducts = await this.ormRepository.findByIds(ids);

    const updatedProducts = products.map( product => {
      ...product,
      quantity: products.find( e => e.id === products.id )?.quantity	s
    })

    foundProduct = {
      ...foundProduct,
      quantity,
    };

    this.ormRepository.save(foundProduct);
    return foundProduct;
    */
    return this.ormRepository.save(products);
  }
}

export default ProductsRepository;

import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const foundCustomer = await this.customersRepository.findById(customer_id);
    if (!foundCustomer) {
      throw new AppError('Customer not found.');
    }

    const foundProducts = await this.productsRepository.findAllById(products);
    if (!foundProducts.length) {
      throw new AppError('No product was found.');
    }

    const existentProductsIds = foundProducts.map(product => product.id);
    const inxistentProducts = products.filter(
      product => !existentProductsIds.includes(product.id),
    );
    if (inxistentProducts.length) {
      throw new AppError(`Product not found: ${inxistentProducts[0].id}`);
    }

    const productsWithNoQuantity = products.filter(product => {
      const existentProduct = foundProducts.filter(p => p.id === product.id)[0];
      return product.quantity > existentProduct.quantity;
    });
    if (productsWithNoQuantity.length) {
      throw new AppError(
        `Quantity not available for product:${productsWithNoQuantity[0].id}`,
      );
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: foundProducts.filter(p => product.id === p.id)[0].price,
    }));

    const toPrint = {
      customer: foundCustomer,
      products: serializedProducts,
    };
    console.log('order:');
    // console.log(JSON.stringify(toPrint));
    console.dir(toPrint, { depth: null, colors: true });

    const order = await this.ordersRepository.create({
      customer: foundCustomer,
      products: serializedProducts,
    });

    const { order_products } = order;

    const orderedProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        foundProducts.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;

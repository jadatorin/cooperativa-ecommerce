import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';

describe('CartController', () => {
  let controller: CartController;
  let cartService: jest.Mocked<CartService>;

  const mockCart = {
    id: 'cart-123',
    items: [
      {
        id: 'item-123',
        product_id: 'product-123',
        quantity: 2,
        unit_price: 2.50,
        subtotal: 5.00,
      },
    ],
    total: 5.00,
    itemCount: 1,
  };

  beforeEach(async () => {
    cartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        { provide: CartService, useValue: cartService },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should return user cart', async () => {
      cartService.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart({ user: { id: 'user-123' } });

      expect(result).toEqual(mockCart);
      expect(cartService.getCart).toHaveBeenCalledWith('user-123');
    });
  });

  describe('addItem', () => {
    it('should add item to cart', async () => {
      const addToCartDto = { productId: 'product-123', quantity: 2 };
      const mockCartItem = {
        id: 'item-123',
        cart_id: 'cart-123',
        product_id: 'product-123',
        quantity: 2,
        unit_price: 2.50,
        subtotal: 5.00,
      };

      cartService.addItem.mockResolvedValue(mockCartItem);

      const result = await controller.addItem(
        { user: { id: 'user-123' } },
        addToCartDto
      );

      expect(result).toEqual(mockCartItem);
      expect(cartService.addItem).toHaveBeenCalledWith('user-123', addToCartDto);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      const updatedItem = {
        id: 'item-123',
        quantity: 5,
        unit_price: 2.50,
        subtotal: 12.50,
      };

      cartService.updateItemQuantity.mockResolvedValue(updatedItem);

      const result = await controller.updateItemQuantity(
        { user: { id: 'user-123' } },
        'item-123',
        5
      );

      expect(result.quantity).toBe(5);
      expect(cartService.updateItemQuantity).toHaveBeenCalledWith('user-123', 'item-123', 5);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      cartService.removeItem.mockResolvedValue({ message: 'Item removed from cart' });

      const result = await controller.removeItem(
        { user: { id: 'user-123' } },
        'item-123'
      );

      expect(result.message).toBe('Item removed from cart');
      expect(cartService.removeItem).toHaveBeenCalledWith('user-123', 'item-123');
    });
  });

  describe('clearCart', () => {
    it('should clear cart', async () => {
      cartService.clearCart.mockResolvedValue({ message: 'Cart cleared' });

      const result = await controller.clearCart({ user: { id: 'user-123' } });

      expect(result.message).toBe('Cart cleared');
      expect(cartService.clearCart).toHaveBeenCalledWith('user-123');
    });
  });
});

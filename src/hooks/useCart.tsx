import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

const CART_TOKEN = '@RocketShoes:cart';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storedCart = localStorage.getItem(CART_TOKEN);

    if (storedCart) {
      return JSON.parse(storedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let totalAmount = 1;
      let productAlreadyOnCart = false;

      let updatedCart = cart.map(product => {
        if (product.id !== productId) return product;

        productAlreadyOnCart = true;
        totalAmount = product.amount + 1;

        return {
          ...product,
          amount: totalAmount,
        };
      });

      if (!productAlreadyOnCart) {
        const response = await api.get(`/products/${productId}`);
        const newProduct = { ...response.data, amount: totalAmount };
        updatedCart.push(newProduct);
      }

      const isAvailable = await checkStockAvailability(productId, totalAmount);
      if (!isAvailable) return;

      setCart(updatedCart);
      localStorage.setItem(CART_TOKEN, JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      let existent_product = false;

      const updatedCart = cart.filter(_product => {
        if (_product.id !== productId) return true;
        existent_product = true;
        return false;
      });

      if (!existent_product) throw Error();

      setCart(updatedCart);
      localStorage.setItem(CART_TOKEN, JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const isAvailable = await checkStockAvailability(productId, amount);
      if (!isAvailable) return;

      const updatedCart = cart.map(product => {
        if (product.id !== productId) return product;

        return {
          ...product,
          amount,
        };
      });

      setCart(updatedCart);
      localStorage.setItem(CART_TOKEN, JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const checkStockAvailability = async (productId: number, amount: number) => {
    const response = await api.get(`/stock/${productId}`);
    if (response.data.amount < amount) {
      toast.error('Quantidade solicitada fora de estoque');
      return false;
    }

    return true;
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

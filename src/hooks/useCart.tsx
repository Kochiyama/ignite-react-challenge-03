import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storedCart = localStorage.getItem('@RocketShoes:cart');

    if (storedCart) {
      return JSON.parse(storedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let productAlreadyOnCart = false;

      let updatedCart = cart.map(product => {
        if (product.id !== productId) return product;

        productAlreadyOnCart = true;

        const updatedProduct = {
          ...product,
          amount: product.amount + 1,
        };

        return updatedProduct;
      });

      if (!productAlreadyOnCart) {
        const response = await api.get(`/products/${productId}`);
        const newProduct = { ...response.data, amount: 1 };
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
    } catch (err: any) {
      console.log(err);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart
        .map(product => {
          if (product.id !== productId) return product;

          const updatedProduct = {
            ...product,
            amount: product.amount - 1,
          };

          return updatedProduct;
        })
        .filter(product => product.amount > 0);

      setCart(updatedCart);
    } catch (err: any) {
      console.log(err);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      await api.put(`/stock/${productId}`, {
        amount,
      });
    } catch (err: any) {
      console.log(err);
    }
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

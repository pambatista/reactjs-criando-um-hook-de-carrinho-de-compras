import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';
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
  addProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`)
      const stock: Stock = response.data
      const hasProduct = cart.find(product => product.id === productId) 

      if(hasProduct) {
        if (stock.amount > hasProduct.amount) {
          const ProductList = [...cart]
          const newCart = ProductList.map(item => {
            if (item.id === productId) {
              item.amount = item.amount + 1
            }
            return item
          })
          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const response = await api.get(`/products/${productId}`)
        const product  = response.data

        product.amount = 1
        const newCart = [...cart, product]
        setCart(newCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const hasProduct = cart.find(product => product.id === productId)

      if (hasProduct) {
        const newCart = cart.filter(product => product.id !== productId)
        setCart(newCart)
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        toast.error('Erro na remoção do produto')
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount > 0) {
        const response = await api.get(`/stock/${productId}`)
        const stock: Stock = response.data
        if(stock.amount >= amount) {
          const newCart = cart.map((product) => {
            if (product.id === productId) {
              product.amount = amount
            }
            return product
          })
          setCart(newCart)

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
